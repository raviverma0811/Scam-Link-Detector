const API_KEY = "4137cb1b097184aa1dff50ce4ee1f946c1a527d4f56a39c4009c8ec15402eeaa";

const scanBtn = document.getElementById("scan");
const spinner = document.getElementById("spinner");
const scanText = document.getElementById("scanText");

let isScanning = false; // toggle flag

document.getElementById("scan").addEventListener("click", async () => {
  // If already scanning → cancel it
  if (isScanning) {
    isScanning = false;
    scanBtn.disabled = false;
    spinner.classList.add("hidden");
    scanText.textContent = "🔍 Scan Page";
    document.getElementById("result").textContent = "⛔ Scan cancelled.";
    return;
  }

  isScanning = true;
  scanBtn.disabled = false; // allow cancel
  spinner.classList.remove("hidden");
  scanText.textContent = "Scanning... (Click to Cancel)";

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      return Array.from(document.querySelectorAll("a")).map(a => a.href);
    }
  }, async (injectionResults) => {
    if (chrome.runtime.lastError || !injectionResults || !injectionResults[0]) {
      document.getElementById("result").textContent = "❌ Cannot scan this page.";
      isScanning = false;
      spinner.classList.add("hidden");
      scanText.textContent = "🔍 Scan Page";
      return;
    }

    const links = injectionResults[0].result;
    const resultText = document.getElementById("result");
    const list = document.getElementById("linkList");
    list.innerHTML = "";

    resultText.textContent = `🔄 Scanning ${links.length} links with AI...`;

    let maliciousCount = 0;

    for (let href of links) {
      // ❌ Stop scanning if user cancelled
      if (!isScanning) break;

      const li = document.createElement("li");
      li.textContent = href;

      try {
        const scanData = await fetch(`https://www.virustotal.com/api/v3/urls`, {
          method: "POST",
          headers: {
            "x-apikey": API_KEY,
            "content-type": "application/x-www-form-urlencoded"
          },
          body: `url=${encodeURIComponent(href)}`
        });
        const scanJson = await scanData.json();
        const scanId = scanJson.data.id;

        const reportRes = await fetch(`https://www.virustotal.com/api/v3/analyses/${scanId}`, {
          headers: { "x-apikey": API_KEY }
        });
        const reportJson = await reportRes.json();

        const malicious = reportJson.data.attributes.stats.malicious;

        if (malicious > 0) {
          li.style.color = "red";
          li.innerHTML += ` ⚠️ <strong>[AI Flagged as Malicious]</strong>`;
          maliciousCount++;
        } else {
          li.style.color = "green";
          li.innerHTML += ` ✅ [Safe]`;
        }

      } catch (err) {
        console.error("Error scanning URL:", href, err);
        li.innerHTML += " ⚠️ [Scan Failed]";
        li.style.color = "gray";
      }

      list.appendChild(li);
    }

    isScanning = false;
    spinner.classList.add("hidden");
    scanText.textContent = "🔍 Scan Page";

    if (maliciousCount > 0) {
      resultText.textContent = `✅ Scan Complete. ${maliciousCount} suspicious link(s) detected.`;
    } else {
      resultText.textContent = isScanning ? "⛔ Scan cancelled." : `✅ Scan Complete. No suspicious links found.`;
    }
  });
});

