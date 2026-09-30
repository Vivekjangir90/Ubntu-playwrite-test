from playwright.sync_api import sync_playwright

URL = "https://vcloud.fit/rb1zad91duy4ra3"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(URL, wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(3000)
    print("Before click:", page.url)
    button = page.locator("#download")
    print("Button count:", button.count())
    if button.count() == 1:
        button.click()
        page.wait_for_timeout(8000)
        print("Final URL:", page.url)
        with open("vcloud_after_click.html", "w", encoding="utf-8") as f:
            f.write(page.content())
        print("Source saved: vcloud_after_click.html")
    browser.close()
