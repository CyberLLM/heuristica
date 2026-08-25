(function () {
  "use strict";

  /* Pasek postępu czytania */
  var pasek = document.getElementById("postep");
  if (pasek) {
    var przelicz = function () {
      var d = document.documentElement;
      var wys = d.scrollHeight - d.clientHeight;
      pasek.style.width = (wys > 0 ? (d.scrollTop / wys) * 100 : 0) + "%";
    };
    document.addEventListener("scroll", przelicz, { passive: true });
    window.addEventListener("resize", przelicz);
    przelicz();
  }

  /* Zgoda na analitykę */
  var baner = document.getElementById("baner-cookies");
  if (baner) {
    var zapisz = function (wartosc) {
      try { localStorage.setItem("zgoda_ga", wartosc); } catch (e) {}
      if (wartosc === "tak" && typeof gtag === "function") {
        gtag("consent", "update", { analytics_storage: "granted" });
      }
      baner.hidden = true;
    };
    var stan = null;
    try { stan = localStorage.getItem("zgoda_ga"); } catch (e) {}
    if (!stan) baner.hidden = false;
    var tak = document.getElementById("cookies-tak");
    var nie = document.getElementById("cookies-nie");
    if (tak) tak.addEventListener("click", function () { zapisz("tak"); });
    if (nie) nie.addEventListener("click", function () { zapisz("nie"); });
  }

  /* Licznik pobrań plików - zdarzenie GA4 file_download */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href$=".json"], a[href$=".zip"], a[href$=".pdf"]');
    if (!a || typeof gtag !== "function") return;
    var nazwa = a.getAttribute("href").split("/").pop();
    gtag("event", "file_download", {
      file_name: nazwa,
      file_extension: nazwa.split(".").pop(),
      link_url: a.href
    });
  });
})();
