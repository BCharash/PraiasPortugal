async function loadBeaches() {
    const response = await fetch("data/beaches.json");
    const beaches = await response.json();

    const select = document.getElementById("beachSelect");

    select.innerHTML = "";

    beaches.forEach(beach => {
        const option = document.createElement("option");
        option.value = beach.id;
        option.textContent = beach.name;
        select.appendChild(option);
    });
}

loadBeaches();