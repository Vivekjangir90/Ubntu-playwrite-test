from playwright.sync_api import sync_playwright

URL = "https://vcloud.fit/rb1zad91duy4ra3"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(URL, wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(3000)
    print("URL:", page.url)
    print("TITLE:", page.title())
    elements = page.locator("text=/Generate Download Link/i")
    print("Generate elements:", elements.count())
    for i in range(elements.count()):
        el = elements.nth(i)
        print("TAG:", el.evaluate("(e) => e.tagName"))
        print("HTML:", el.evaluate("(e) => e.outerHTML"))
    browser.close()
