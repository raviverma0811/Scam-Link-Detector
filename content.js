const suspiciousKeywords = {
  "login": "Fake Login",
  "signin": "Fake Login",
  "verify": "Fake Login",
  "account": "Fake Login",
  "free": "Giveaway",
  "win": "Giveaway",
  "prize": "Giveaway",
  "download": "Malware",
  "click": "Clickbait"
};

function getRiskScore(url) {
  let score = 0;
  const domain = (new URL(url)).hostname;

  // suspicious patterns
  if (domain.split('.').length > 3) score += 1;
  if (/[0-9]{5,}/.test(url)) score += 1;
  if (url.includes("@") || url.includes("%")) score += 1;

  // keyword boost
  for (let word in suspiciousKeywords) {
    if (url.toLowerCase().includes(word)) score += 2;
  }

  return score;
}

function categorizeLink(url) {
  for (let keyword in suspiciousKeywords) {
    if (url.toLowerCase().includes(keyword)) {
      return suspiciousKeywords[keyword];
    }
  }
  return "Unknown";
}

// Scan all links
const links = document.querySelectorAll("a");
links.forEach(link => {
  const href = link.href;

  try {
    const score = getRiskScore(href);
    if (score >= 3) {
      const category = categorizeLink(href);
      link.style.border = "2px solid red";
      link.style.backgroundColor = "#ffe6e6";
      link.title = `⚠️ ${category} - Risk Score: ${score}`;
    }
  } catch (e) {
    console.warn("Invalid URL skipped:", href);
  }
});
