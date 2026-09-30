# Ubuntu Playwright Test

Playwright testing project running inside Ubuntu via Termux/proot-distro on Android.

## Setup

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium

## Test

python test_playwright.py

## VCloud test

python vcloud_resolver.py
