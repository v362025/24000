from playwright.sync_api import sync_playwright

def verify_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:3004')
        
        print("Waiting for page load...")
        page.wait_for_timeout(1000) # Wait 1s for React to mount and show Ad
        
        # Screenshot 1: Startup Ad
        if page.is_visible('img[src="/logo.jpg"]'):
            print("Startup Ad Visible. Taking Screenshot 1.")
            page.screenshot(path='verification_ad.png')
        else:
            print("Startup Ad NOT visible.")
            page.screenshot(path='verification_fail_ad.png')
            
        # Wait for Ad to close (Duration is 2s, give it 3s total)
        page.wait_for_timeout(3000)
        
        # Screenshot 2: Login/Dashboard
        print("Taking Screenshot 2 (Post-Ad).")
        page.screenshot(path='verification_dashboard.png')
        
        content = page.content()
        
        # Check for "Nadim" (Should NOT be there)
        if "Nadim" in content:
            print("FAILURE: 'Nadim' found in content.")
        else:
            print("SUCCESS: 'Nadim' NOT found in content.")
            
        # Check for "Powered by AI"
        if "Powered by AI" in content:
            print("SUCCESS: 'Powered by AI' found.")
        else:
            print("FAILURE: 'Powered by AI' NOT found.")
            
        browser.close()

if __name__ == "__main__":
    verify_ui()
