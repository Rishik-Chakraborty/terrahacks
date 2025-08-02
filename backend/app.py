import requests
from bs4 import BeautifulSoup

def scrape_shopppers_gta(med_name):
    url = f"https://www.shoppersdrugmart.ca/search?text={med_name}"
    resp = requests.get(url, headers={"User-Agent":"Mozilla/5.0"})
    soup = BeautifulSoup(resp.text, "html.parser")

    items = []
    for card in soup.select(".product-card"):
        title = card.select_one(".product-title") and card.select_one(".product-title").get_text(strip=True)
        price = card.select_one(".price__value") and card.select_one(".price__value").get_text(strip=True)
        availability = card.select_one(".availability") and card.select_one(".availability").get_text(strip=True)
        if title:
            items.append({"source": "Shoppers", "title": title, "price": price or "N/A", "availability": availability or "Unknown"})
    return items

def scrape_rexall_ca(med_name):
    url = f"https://www.rexall.ca/shop/{med_name}"
    resp = requests.get(url, headers={"User-Agent":"Mozilla/5.0"})
    soup = BeautifulSoup(resp.text, "html.parser")

    items = []
    for prod in soup.select("div.product-cell"):
        name = prod.select_one("div.product-name") and prod.select_one("div.product-name").get_text(strip=True)
        price = prod.select_one("span.price") and prod.select_one("span.price").get_text(strip=True)
        stock = "In Stock" if prod.select_one(".add-to-cart-btn:not([disabled])") else "Out of Stock"
        if name:
            items.append({"source": "Rexall", "title": name, "price": price or "N/A", "availability": stock})
    return items

if __name__ == "__main__":
    med = "acetaminophen"  # example medication
    sd_items = scrape_shopppers_gta(med)
    rx_items = scrape_rexall_ca(med)
    print("Shoppers Results:", sd_items)
    print("Rexall Results:", rx_items)
