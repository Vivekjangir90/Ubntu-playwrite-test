from playwright.sync_api import sync_playwright

URL = "https://vcloud.fit/rb1zad91duy4ra3"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 720})

    print("Opening:", URL)
    page.goto(URL, wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(3000)

    print("Initial URL:", page.url)
    print("Title:", page.title())

    button = page.locator("#download")

    if button.count() != 1:
        print("Generate Download Link button not found")
        browser.close()
        raise SystemExit(1)

    print("Clicking Generate Download Link...")
    button.click()
    page.wait_for_timeout(8000)

    print("\\nFINAL URL:")
    print(page.url)

    print("\\nDOWNLOAD LINKS:")
    links = page.locator("a")

    for i in range(links.count()):
        try:
            link = links.nth(i)
            text = link.inner_text().strip()
            href = link.get_attribute("href")

            if href and text.lower().startswith("download"):
                print(f"\\n{text}")
                print(href)
        except Exception:
            pass

    browser.close()
