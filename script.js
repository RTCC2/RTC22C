// Background image array
const backgrounds = [
    'url("background1.png")',
    'url("background2.png")',
    'url("background3.png")',
    'url("background4.png")'
];

let currentBackgroundIndex = 0;

// Function to switch background
function switchBackground() {
    currentBackgroundIndex = (currentBackgroundIndex + 1) % backgrounds.length;
    document.body.style.backgroundImage = backgrounds[currentBackgroundIndex];
}

// Switch background every 3 seconds
setInterval(switchBackground, 3000);

// Data Lokasi dengan parameter hidrologi
const dataLokasi = {
    utara: { infiltrasi: 10, mat: 2.5, intensitas: 120 }, // Infiltrasi (mm), MAT (m), Intensitas hujan (mm/jam)
    selatan: { infiltrasi: 15, mat: 3.0, intensitas: 110 },
    timur: { infiltrasi: 8, mat: 2.0, intensitas: 130 },
    barat: { infiltrasi: 12, mat: 2.8, intensitas: 115 },
};

// Element references
const luasWilayahInput = document.getElementById("luasWilayah");
const luasTerpakaiInput = document.getElementById("luasTerpakai");
const satuanLuasWilayah = document.getElementById("satuanLuasWilayah");
const satuanLuasTerpakai = document.getElementById("satuanLuasTerpakai");
const lokasiInput = document.getElementById("lokasi");
const hitungButton = document.getElementById("hitungButton");
const outputLuas = document.getElementById("outputLuas");
const outputKoef = document.getElementById("outputKoef");
const outputVolume = document.getElementById("outputVolume");
const panjangInput = document.getElementById("panjang");
const lebarInput = document.getElementById("lebar");
const tinggiInput = document.getElementById("tinggi");
const saranMaterial = document.getElementById("saranMaterial");
const peringatan = document.getElementById("peringatan");

// Initial volume value
let calculatedVolume = 0;

// Helper function to convert Ha to m²
function convertToMeters(value, unit) {
    return unit === "ha" ? value * 10000 : value;
}

// Function to calculate runoff coefficient
function calculateCoefficient(luasWilayah, luasTerpakai) {
    const koefTerpakai = 0.5; // Koefisien untuk area terbangun
    const koefSisa = 0.1; // Koefisien untuk area tidak terbangun
    const luasSisa = luasWilayah - luasTerpakai;
    return ((luasTerpakai * koefTerpakai) + (luasSisa * koefSisa)) / luasWilayah;
}

// Function to calculate runoff volume
function calculateVolume(lokasi, luasWilayah, coefficient) {
    const data = dataLokasi[lokasi];
    const intensitasHujan = data.intensitas / 1000; // Konversi mm/jam ke meter/jam
    const infiltrasi = data.infiltrasi / 1000; // Konversi mm/jam ke meter/jam

    // Rumus volume limpasan: Q = C × I × A - Infiltrasi
    const volume = coefficient * intensitasHujan * luasWilayah - (infiltrasi * luasWilayah);
    return volume > 0 ? volume : 0; // Jika infiltrasi lebih besar, volume limpasan = 0
}

// Function to evaluate bozem design
function evaluasiBozem(lokasi, tinggiBozem) {
    const mat = dataLokasi[lokasi].mat;
    const saranMaterialElement = document.getElementById("saranMaterial");
    const peringatanElement = document.getElementById("peringatan");
    if (tinggiBozem > mat) {
        saranMaterialElement.textContent = "Material yang disarankan: Beton atau material tahan air.";
        peringatanElement.textContent = "Peringatan: Kedalaman bozem melebihi muka air tanah. Evaluasi ulang kedalaman!";
        peringatanElement.style.color = "red"; // Tampilkan peringatan dalam warna mencolok
    } else {
        saranMaterialElement.textContent = "Material yang disarankan: Tanah atau material lokal.";
        peringatanElement.textContent = "Kedalaman bozem dalam batas aman.";
        peringatanElement.style.color = "white"; // Warna netral untuk kondisi aman
    }
    if (tinggiInput.value) {
        const tinggiBozem = parseFloat(tinggiInput.value);
        evaluasiBozem(lokasi, tinggiBozem);
    }
    
}

// Event listener for the "Hitung" button
hitungButton.addEventListener("click", () => {
    const lokasi = lokasiInput.value;
    const luasWilayah = convertToMeters(parseFloat(luasWilayahInput.value), satuanLuasWilayah.value);
    const luasTerpakai = convertToMeters(parseFloat(luasTerpakaiInput.value), satuanLuasTerpakai.value);

    if (!lokasi) {
        alert("Pilih lokasi terlebih dahulu.");
        return;
    }

    if (isNaN(luasWilayah) || isNaN(luasTerpakai) || luasWilayah <= 0 || luasTerpakai <= 0) {
        alert("Harap masukkan nilai luas wilayah dan luas terpakai dengan benar.");
        return;
    }

    if (luasTerpakai > luasWilayah) {
        alert("Luas terpakai tidak boleh lebih besar dari luas wilayah.");
        return;
    }

    const coefficient = calculateCoefficient(luasWilayah, luasTerpakai);
    calculatedVolume = calculateVolume(lokasi, luasWilayah, coefficient);

    outputLuas.textContent = `Luas Wilayah: ${luasWilayah.toFixed(2)} m²`;
    outputKoef.textContent = `Koefisien Limpasan: ${coefficient.toFixed(2)}`;
    outputVolume.textContent = `Volume Limpasan: ${calculatedVolume.toFixed(2)} m³`;

    // Set default dimensions for bozem
    setDefaultDimensions(calculatedVolume);

    const tinggiBozem = parseFloat(tinggiInput.value);
    if (tinggiBozem) evaluasiBozem(lokasi, tinggiBozem);
});

// Function to set default bozem dimensions
function setDefaultDimensions(volume) {
    const defaultPanjang = 10; // Panjang default (m)
    const defaultTinggi = Math.min(2, volume / (defaultPanjang * 5)); // Tinggi default (m)
    const defaultLebar = volume / (defaultPanjang * defaultTinggi);

    panjangInput.value = defaultPanjang.toFixed(2);
    lebarInput.value = defaultLebar.toFixed(2);
    tinggiInput.value = defaultTinggi.toFixed(2);

    const lokasi = lokasiInput.value;
    if (lokasi) evaluasiBozem(lokasi, defaultTinggi);
}

// Event listeners for dimension adjustments
["panjang", "lebar", "tinggi"].forEach(dimension => {
    document.getElementById(dimension).addEventListener("input", () => {
        adjustDimensions(dimension);
    });
    document.getElementById("hitungButton").addEventListener("click", () => {
        const lokasi = lokasiInput.value; // Lokasi yang dipilih
        const tinggiBozem = parseFloat(tinggiInput.value); // Tinggi bozem yang dimasukkan
    
        if (lokasi && !isNaN(tinggiBozem)) {
            evaluasiBozem(lokasi, tinggiBozem); // Panggil evaluasi
        } else {
            alert("Harap masukkan lokasi dan tinggi bozem yang valid.");
        }
    });    
});

// Function to adjust dimensions dynamically
function adjustDimensions(changedInput) {
    const panjang = parseFloat(panjangInput.value) || 0;
    const lebar = parseFloat(lebarInput.value) || 0;
    const tinggi = parseFloat(tinggiInput.value) || 0;

    if (calculatedVolume <= 0) {
        alert("Harap hitung volume terlebih dahulu.");
        return;
    }

    // Adjust dimensions
    if (changedInput === "panjang" && panjang > 0) {
        lebarInput.value = (calculatedVolume / (panjang * tinggi)).toFixed(2);
    } else if (changedInput === "lebar" && lebar > 0) {
        panjangInput.value = (calculatedVolume / (lebar * tinggi)).toFixed(2);
    } else if (changedInput === "tinggi" && tinggi > 0) {
        lebarInput.value = (calculatedVolume / (panjang * tinggi)).toFixed(2);
    }
}

tinggiInput.addEventListener("input", () => {
    const tinggiBozem = parseFloat(tinggiInput.value) || 0;
    const lokasi = lokasiInput.value;

    if (lokasi && tinggiBozem) {
        evaluasiBozem(lokasi, tinggiBozem);
    }
});
