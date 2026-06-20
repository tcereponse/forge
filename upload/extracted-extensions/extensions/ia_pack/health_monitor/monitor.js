// Moteur du Détecteur
const dot = document.createElement('div');
dot.style = "position:fixed; top:10px; right:10px; width:15px; height:15px; border-radius:50%; background:orange; z-index:9999999; box-shadow: 0 0 10px orange;";
document.body.appendChild(dot);

setInterval(async () => {
    try {
        const res = await fetch("http://127.0.0.1:8088/docs");
        dot.style.background = res.ok ? "#00FF88" : "red";
        dot.style.boxShadow = res.ok ? "0 0 10px #00FF88" : "0 0 10px red";
    } catch(e) {
        dot.style.background = "red";
        dot.style.boxShadow = "0 0 10px red";
    }
}, 3000);
