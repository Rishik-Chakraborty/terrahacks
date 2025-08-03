
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from webdriver_manager.chrome import ChromeDriverManager
import requests
import urllib.parse
import time
import re


def setup_driver():
    """Setup Chrome driver with working options for Rexall"""
    options = Options()
    # Uncomment next line for headless mode
    # options.add_argument("--headless")
    
    # Basic optimizations that don't break functionality
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-extensions")
    
    return webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)


def get_postal_code():
    """Get postal code from IP geolocation"""
    try:
        print("📍 Detecting your location...")
        res = requests.get("https://ipinfo.io", timeout=3)
        data = res.json()
        postal = data.get("postal", None)
        city = data.get("city", "")
        region = data.get("region", "")
        if postal:
            print(f"✅ Detected location: {city}, {region} ({postal})")
        return postal
    except Exception as e:
        print(f"⚠️ Location detection failed: {e}")
        return None


def get_user_postal_code():
    """Get postal code from user input or auto-detection"""
    auto_postal = get_postal_code()
    if auto_postal:
        use_auto = input(f"Use detected postal code {auto_postal}? (y/n): ").lower().strip()
        if use_auto in ['y', 'yes', '']:
            return auto_postal
    
    while True:
        postal = input("📮 Enter your postal code (e.g. M5G 2C3): ").strip()
        if postal:
            return postal
        print("Please enter a valid postal code.")


def set_rexall_store(driver, postal_code):
    """Set Rexall store location"""
    try:
        print("🏪 Setting up store location...")
        
        # Go to main page first
        driver.get("https://www.rexall.ca")
        
        # Wait for page to load
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        
        time.sleep(3)  # Let page fully load
        
        # Look for store selector
        store_button = None
        selectors_to_try = [
            "button[data-testid='store-selector-button']",
            "button.store-selector-trigger",
            ".store-selector button",
            "[data-cy='store-selector']",
            "button[aria-label*='store']",
            ".header-store-selector button",
            ".store-locator-trigger"
        ]
        
        for selector in selectors_to_try:
            try:
                store_button = driver.find_element(By.CSS_SELECTOR, selector)
                print(f"✅ Found store selector with: {selector}")
                break
            except:
                continue
        
        if not store_button:
            # Try finding by text content
            buttons = driver.find_elements(By.TAG_NAME, "button")
            for button in buttons:
                button_text = button.text.lower()
                if any(text in button_text for text in ['store', 'location', 'select', 'find']):
                    store_button = button
                    print(f"✅ Found store selector by text: '{button.text}'")
                    break
        
        if store_button:
            driver.execute_script("arguments[0].click();", store_button)
            time.sleep(2)
            
            # Wait for store search input
            search_input = None
            input_selectors = [
                "input[placeholder*='postal']",
                "input[placeholder*='address']", 
                "#store-search-input",
                "input[name='storeSearch']",
                ".store-search input",
                "input[type='text']"
            ]
            
            for selector in input_selectors:
                try:
                    search_input = WebDriverWait(driver, 5).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                    )
                    break
                except:
                    continue
            
            if search_input:
                search_input.clear()
                search_input.send_keys(postal_code)
                search_input.send_keys(Keys.ENTER)
                
                time.sleep(3)
                
                # Select first store result
                store_results = driver.find_elements(By.CSS_SELECTOR, 
                    ".store-result, .location-tile, .store-option, [data-testid*='store'], .store-list-item")
                
                if store_results:
                    driver.execute_script("arguments[0].click();", store_results[0])
                    print(f"✅ Store set for postal code: {postal_code}")
                    time.sleep(2)
                else:
                    print("⚠️ No stores found for postal code")
            else:
                print("⚠️ Could not find store search input")
        else:
            print("⚠️ Could not find store selector button")
            
    except Exception as e:
        print(f"⚠️ Error setting store: {e}")


def check_product_availability(driver, product_link, product_name):
    """Check actual availability by visiting the product page"""
    try:
        print(f"🔍 Checking availability for: {product_name}")
        
        # Open product page in new tab to preserve search results
        original_window = driver.current_window_handle
        driver.execute_script("window.open('');")
        driver.switch_to.window(driver.window_handles[1])
        
        # Navigate to product page
        driver.get(product_link)
        
        # Wait for product page to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        
        time.sleep(3)  # Let page content load
        
        # Check for availability indicators
        page_text = driver.page_source.lower()
        
        # Look for out of stock indicators
        out_of_stock_indicators = [
            "out of stock", "not available", "sold out", "unavailable",
            "temporarily unavailable", "currently unavailable", "stock: 0",
            "no stock", "not in stock", "item unavailable"
        ]
        
        # Look for in stock indicators
        in_stock_indicators = [
            "add to cart", "buy now", "in stock", "available", "add to bag",
            "purchase", "shop now"
        ]
        
        # Check text content first
        if any(indicator in page_text for indicator in out_of_stock_indicators):
            availability = "Out of Stock"
            print(f"❌ Found out of stock indicator in text")
        elif any(indicator in page_text for indicator in in_stock_indicators):
            availability = "In Stock"
            print(f"✅ Found in stock indicator in text")
        else:
            # Check for specific elements
            availability = "Unknown"
            
            # Look for add to cart button
            add_to_cart_selectors = [
                "button[data-testid*='add-to-cart']",
                ".add-to-cart-button:not([disabled])",
                "button:contains('Add to Cart'):not([disabled])",
                "button:contains('Buy Now'):not([disabled])",
                ".buy-button:not([disabled])",
                "button[class*='add']:not([disabled])"
            ]
            
            for selector in add_to_cart_selectors:
                try:
                    elements = driver.find_elements(By.CSS_SELECTOR, selector)
                    if elements:
                        # Check if button is enabled
                        for element in elements:
                            if not element.get_attribute("disabled"):
                                availability = "In Stock"
                                print(f"✅ Found enabled add to cart button")
                                break
                        if availability == "In Stock":
                            break
                except:
                    continue
            
            # Look for disabled buttons or out of stock elements
            if availability == "Unknown":
                disabled_selectors = [
                    "button[disabled]",
                    ".out-of-stock",
                    ".unavailable",
                    "[data-stock='0']",
                    ".sold-out"
                ]
                
                for selector in disabled_selectors:
                    try:
                        elements = driver.find_elements(By.CSS_SELECTOR, selector)
                        if elements:
                            availability = "Out of Stock"
                            print(f"❌ Found disabled/out of stock element")
                            break
                    except:
                        continue
            
            # Final fallback - check button text
            if availability == "Unknown":
                buttons = driver.find_elements(By.TAG_NAME, "button")
                for button in buttons:
                    button_text = button.text.lower()
                    if any(text in button_text for text in ["add to cart", "buy", "purchase"]):
                        if not button.get_attribute("disabled"):
                            availability = "In Stock"
                            print(f"✅ Found active purchase button: {button.text}")
                            break
                        else:
                            availability = "Out of Stock"
                            print(f"❌ Found disabled purchase button: {button.text}")
                            break
        
        # Close the product tab and return to search results
        driver.close()
        driver.switch_to.window(original_window)
        
        print(f"📊 Final availability for {product_name}: {availability}")
        return availability
        
    except Exception as e:
        print(f"❌ Error checking availability for {product_name}: {e}")
        # Close tab if it was opened
        try:
            if len(driver.window_handles) > 1:
                driver.close()
                driver.switch_to.window(driver.window_handles[0])
        except:
            pass
        return "Unknown"


def extract_products_with_links(driver):
    """Extract product names and their links for availability checking"""
    print("🔍 Extracting products with links...")
    
    products = []
    
    # Look for product containers with links
    product_selectors = [
        ".product-tile a", ".product-card a", ".search-result-item a",
        "[data-testid*='product'] a", ".grid-item a", "[class*='product'] a"
    ]
    
    for selector in product_selectors:
        try:
            links = driver.find_elements(By.CSS_SELECTOR, selector)
            for link in links:
                try:
                    href = link.get_attribute("href")
                    if href and "product" in href.lower():
                        # Get product name from link text or nearby elements
                        product_name = link.text.strip()
                        
                        # If link text is empty, try to find name in parent element
                        if not product_name:
                            parent = link.find_element(By.XPATH, "./..")
                            product_name = parent.text.strip()
                        
                        # Clean up product name
                        if product_name and len(product_name) > 5 and len(product_name) < 200:
                            # Remove common UI text
                            lines = product_name.split('\n')
                            clean_name = ""
                            for line in lines:
                                line_clean = line.strip()
                                if (len(line_clean) > 5 and 
                                    not any(ui_text in line_clean.lower() for ui_text in 
                                           ['view', 'shop', 'buy', 'cart', 'compare', 'wishlist'])):
                                    clean_name = line_clean
                                    break
                            
                            if clean_name:
                                products.append({
                                    "name": clean_name,
                                    "link": href
                                })
                                print(f"✅ Found product: {clean_name}")
                                
                                if len(products) >= 8:  # Limit to avoid too many page loads
                                    break
                except Exception as e:
                    continue
            
            if products:
                break  # If we found products with one selector, use those
                
        except:
            continue
    
    # Remove duplicates based on name
    unique_products = []
    seen_names = set()
    for product in products:
        if product["name"] not in seen_names:
            unique_products.append(product)
            seen_names.add(product["name"])
    
    return unique_products


def scrape_rexall_with_real_availability(med_name, postal_code):
    """Scrape Rexall with real availability checking"""
    driver = setup_driver()
    
    try:
        # First set the store location
        set_rexall_store(driver, postal_code)
        
        # Now search for the medicine
        encoded_med = urllib.parse.quote_plus(med_name)
        search_url = f"https://www.rexall.ca/search?q={encoded_med}"
        
        print(f"\n🔍 Searching for '{med_name}'...")
        driver.get(search_url)
        
        # Wait for search results to load
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        
        time.sleep(5)  # Let search results fully load
        
        print(f"📄 Page title: {driver.title}")
        
        # Extract products with their links
        products = extract_products_with_links(driver)
        
        if not products:
            print("❌ No products with links found")
            return []
        
        print(f"\n✅ Found {len(products)} products to check availability")
        
        # Check real availability for each product
        results = []
        for i, product in enumerate(products):
            print(f"\n📋 Checking product {i+1}/{len(products)}")
            
            availability = check_product_availability(driver, product["link"], product["name"])
            
            result = {
                "source": "Rexall",
                "title": product["name"],
                "availability": availability
            }
            results.append(result)
            
            # Small delay between checks
            time.sleep(1)
        
        return results
        
    except Exception as e:
        print(f"❌ Scraping error: {e}")
        return []
    finally:
        # Keep browser open for debugging
        print("\n🔍 Keeping browser open for 5 seconds...")
        time.sleep(5)
        driver.quit()


def main():
    """Main function"""
    print("💊 Rexall Prescription Finder (Real Availability)")
    print("=" * 55)
    
    # Get medicine name
    while True:
        medicine = input("Enter medicine name to search: ").strip()
        if medicine:
            break
        print("Please enter a medicine name.")
    
    # Get postal code
    postal_code = get_user_postal_code()
    
    print(f"\n🔍 Starting prescription search with real availability checking...")
    print("-" * 60)
    
    # Search Rexall
    results = scrape_rexall_with_real_availability(medicine, postal_code)
    
    # Display results
    print("\n" + "=" * 60)
    print("📋 PRESCRIPTION RESULTS (REAL AVAILABILITY)")
    print("=" * 60)
    
    if results:
        in_stock_count = 0
        out_of_stock_count = 0
        
        for i, item in enumerate(results, 1):
            status_icon = "✅" if item['availability'] == "In Stock" else "❌" if item['availability'] == "Out of Stock" else "❓"
            print(f"\n{i}. {item['title']}")
            print(f"   📦 Status: {status_icon} {item['availability']}")
            print("-" * 50)
            
            if item['availability'] == "In Stock":
                in_stock_count += 1
            elif item['availability'] == "Out of Stock":
                out_of_stock_count += 1
        
        print(f"\n📊 SUMMARY:")
        print(f"✅ In Stock: {in_stock_count}")
        print(f"❌ Out of Stock: {out_of_stock_count}")
        print(f"❓ Unknown: {len(results) - in_stock_count - out_of_stock_count}")
        
    else:
        print("❌ No prescriptions found. This could mean:")
        print("   • The medicine is not available at Rexall")
        print("   • Try a different search term (generic vs brand name)")
        print("   • Try shorter/simpler search terms")
        print("   • Check if it requires a prescription")
    
    print(f"\n✅ Search completed for '{medicine}' near {postal_code}")


if __name__ == "__main__":
    main()
