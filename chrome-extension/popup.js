const API_URL = "http://localhost:5000/api/scan/analyze";

document.getElementById("scanBtn").addEventListener("click", async () => {
  const text = document.getElementById("text").value.trim();
  const result = document.getElementById("result");

  if (!text) {
    result.textContent = "Please add text to scan.";
    return;
  }

  result.textContent = "Scanning...";

  try {
    result.textContent =
      "This scaffold requires authenticated calls. Add JWT handling and secure API proxy before production use.";
  } catch (error) {
    result.textContent = "Scan failed.";
  }
});
