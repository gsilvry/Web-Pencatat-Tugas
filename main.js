
let state = [];
let namaAktif = "";
let nrpAktif = "";

const $ = (id) => document.getElementById(id);

function kunciSimpanan() {
    return `pencatat-tugas-${nrpAktif}`;
}

function simpan() {
    if (!nrpAktif) return;

    localStorage.setItem(
        kunciSimpanan(),
        JSON.stringify({
            nama: namaAktif,
            tugas: state
        })
    );
}

function bukaHalaman(id) {
    if (!nrpAktif) {
        $("login").hidden = false;
        $("login").classList.add("aktif");
        return;
    }

    const tujuan = $(id);
    if (!tujuan) return;

    document.querySelectorAll(".view").forEach((bagian) => {
        bagian.classList.remove("aktif");
        bagian.hidden = true;
    });

    tujuan.hidden = false;

    requestAnimationFrame(() => {
        tujuan.classList.add("aktif");
    });

    if (id === "home") tampilHome();
    if (id === "daftar") tampil();
    if (id === "statistik") tampilStatistik();
}

// LOGIN: nama minimal 3 karakter, NRP tepat 10 digit
$("form-login").addEventListener("submit", function(e) {
    e.preventDefault();

    const namaInput = $("nama").value.trim();
    const nrpInput = $("nrp").value.trim();

    if (namaInput.length < 3) {
        alert("Nama harus minimal 3 karakter.");
        return;
    }

    if (!/^\d{10}$/.test(nrpInput)) {
        alert("NRP harus tepat 10 angka dan tidak boleh mengandung huruf.");
        return;
    }

    namaAktif = namaInput;
    nrpAktif = nrpInput;

    try {
        const data = JSON.parse(
            localStorage.getItem(kunciSimpanan())
        ) || {};

        state = Array.isArray(data.tugas) ? data.tugas : [];

        simpan();

        $("salam").textContent = `Halo, ${namaAktif}! ♡`;
        $("login").hidden = true;

        bukaHalaman("home");
    } catch (error) {
        alert("Terjadi kesalahan saat memuat data.");
    }
});

// LOGOUT
function logout() {
    simpan();

    nrpAktif = "";
    namaAktif = "";
    state = [];

    document.querySelectorAll(".view").forEach((bagian) => {
        bagian.classList.remove("aktif");
        bagian.hidden = bagian.id !== "login";
    });

    $("nama").value = "";
    $("nrp").value = "";
    $("login").classList.add("aktif");
}

// TAMBAH TUGAS: nama tugas dan mata kuliah minimal 3 karakter
$("form").addEventListener("submit", function(e) {
    e.preventDefault();

    if (!nrpAktif) return;

    const judul = $("isian").value.trim();
    const matkul = $("matkul").value.trim();
    const deadline = $("deadline").value;

    if (judul.length < 3) {
        alert("Nama tugas harus minimal 3 karakter.");
        return;
    }

    if (matkul.length < 3) {
        alert("Nama mata kuliah harus minimal 3 karakter.");
        return;
    }

    state.push({
        id: Date.now() + Math.random(),
        judul,
        matkul,
        deadline,
        selesai: false
    });

    simpan();
    $("form").reset();

    tampil();
    tampilHome();
    tampilStatistik();
    getar();
});

// MEMBUAT ITEM TUGAS
function buatItem(tugas, nomorBelumSelesai) {
    const li = document.createElement("li");

    const barisAtas = document.createElement("div");
    barisAtas.className = tugas.selesai ? "selesai" : "";

    if (!tugas.selesai) {
        barisAtas.textContent = `${nomorBelumSelesai}. ${tugas.judul}`;
    } else {
        barisAtas.textContent = tugas.judul;
    }

    const info = document.createElement("div");
    info.className = "tugas-info";

    const deadlineText = tugas.deadline
        ? tugas.deadline
        : "Tidak ada deadline";

    info.textContent = `${tugas.matkul} | Deadline: ${deadlineText}`;

    const label = document.createElement("label");
    const checkbox = document.createElement("input");

    checkbox.type = "checkbox";
    checkbox.checked = tugas.selesai;
    checkbox.style.display = "inline-block";
    checkbox.style.width = "auto";
    checkbox.style.margin = "8px";

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(" Selesai"));

    checkbox.addEventListener("change", function() {
        tugas.selesai = checkbox.checked;
        simpan();
        tampil();
        tampilHome();
        tampilStatistik();
    });

    const tombolHapus = document.createElement("button");
    tombolHapus.type = "button";
    tombolHapus.textContent = "Hapus";
    tombolHapus.className = "hapus";

    tombolHapus.addEventListener("click", function() {
        state = state.filter((item) => item.id !== tugas.id);
        simpan();
        tampil();
        tampilHome();
        tampilStatistik();
    });

    li.appendChild(barisAtas);
    li.appendChild(info);
    li.appendChild(label);
    li.appendChild(document.createElement("br"));
    li.appendChild(tombolHapus);

    return li;
}

// FILTER MATA KULIAH
function renderFilterMatkul() {
    const select = $("filter-matkul");
    const pilihanLama = select.value;

    const daftarMatkul = [
        ...new Set(state.map((tugas) => tugas.matkul))
    ].sort((a, b) => a.localeCompare(b));

    select.replaceChildren();

    const semua = document.createElement("option");
    semua.value = "";
    semua.textContent = "Semua Mata Kuliah";
    select.appendChild(semua);

    daftarMatkul.forEach((matkul) => {
        const option = document.createElement("option");
        option.value = matkul;
        option.textContent = matkul;
        select.appendChild(option);
    });

    if (daftarMatkul.includes(pilihanLama)) {
        select.value = pilihanLama;
    }
}

// MENAMPILKAN DAFTAR TUGAS
function tampil() {
    renderFilterMatkul();

    const filterMatkul = $("filter-matkul").value;
    const filterStatus = $("filter-status").value;

    const hasil = state.filter((tugas) => {
        const cocokMatkul =
            !filterMatkul || tugas.matkul === filterMatkul;

        const cocokStatus =
            !filterStatus ||
            (filterStatus === "selesai" && tugas.selesai) ||
            (filterStatus === "belum" && !tugas.selesai);

        return cocokMatkul && cocokStatus;
    });

    const list = $("list");
    list.replaceChildren();

    let nomor = 0;

    hasil.forEach((tugas) => {
        if (!tugas.selesai) nomor++;
        list.appendChild(
            buatItem(tugas, tugas.selesai ? null : nomor)
        );
    });

    $("jumlah-filter").textContent =
        `Jumlah tugas: ${hasil.length}`;

    tampilStatistik();
}

$("filter-matkul").addEventListener("change", tampil);
$("filter-status").addEventListener("change", tampil);

// HITUNG STATISTIK
function hitung() {
    const total = state.length;
    const selesai = state.filter((tugas) => tugas.selesai).length;
    const belum = total - selesai;
    const persen = total === 0
        ? 0
        : Math.round((selesai / total) * 100);

    return { total, selesai, belum, persen };
}

// HOME
function tampilHome() {
    const { total, selesai, belum } = hitung();

    $("total-home").textContent = total;
    $("belum-home").textContent = belum;
    $("selesai-home").textContent = selesai;

    const ringkasan = $("ringkasan-matkul");
    ringkasan.replaceChildren();

    const matkulUnik = [...new Set(
        state.map((tugas) => tugas.matkul)
    )].sort((a, b) => a.localeCompare(b));

    if (matkulUnik.length === 0) {
        ringkasan.textContent = "Belum ada tugas.";
        return;
    }

    matkulUnik.forEach((matkul) => {
        const tugasMatkul = state.filter(
            (tugas) => tugas.matkul === matkul
        );

        const selesaiMatkul = tugasMatkul.filter(
            (tugas) => tugas.selesai
        ).length;

        const p = document.createElement("p");
        p.textContent =
            `${matkul}: ${selesaiMatkul}/${tugasMatkul.length} tugas selesai`;

        ringkasan.appendChild(p);
    });
}

// STATISTIK DAN UCAPAN SELAMAT
function tampilStatistik() {
    const { total, selesai, belum, persen } = hitung();

    $("angka").textContent = `${persen}%`;
    $("isi-progres").style.width = `${persen}%`;

    $("isi-progres").style.background =
        persen <= 50 ? "#ffd700" : "#28a745";

    if (total === 0) {
        $("keterangan-progres").textContent =
            "Belum ada tugas.";
    } else {
        $("keterangan-progres").textContent =
            `${selesai} dari ${total} tugas selesai. ${belum} tugas belum selesai.`;
    }

    const ucapan = $("ucapan-selamat");
    const gambar = $("gambar-selamat");
    const fallback = $("fallback-selamat");

    ucapan.hidden = !(total > 0 && persen === 100);

    gambar.onerror = function() {
        gambar.hidden = true;
        fallback.hidden = false;
    };

    gambar.onload = function() {
        gambar.hidden = false;
        fallback.hidden = true;
    };

    if (total > 0 && persen === 100) {
        if (gambar.complete && gambar.naturalWidth > 0) {
            gambar.hidden = false;
            fallback.hidden = true;
        } else if (gambar.complete) {
            gambar.hidden = true;
            fallback.hidden = false;
        }
    }
}

// GETAR JIKA PERANGKAT MENDUKUNG
function getar() {
    if ("vibrate" in navigator) {
        navigator.vibrate(100);
    }
}

// TAMPILKAN LOGIN SAAT HALAMAN PERTAMA DIBUKA
document.querySelectorAll(".view").forEach((bagian) => {
    bagian.classList.remove("aktif");
    bagian.hidden = bagian.id !== "login";
});

$("login").classList.add("aktif");
