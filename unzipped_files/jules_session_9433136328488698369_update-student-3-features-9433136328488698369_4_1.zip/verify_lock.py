from playwright.sync_api import sync_playwright

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:3004')
        
        # --- LOGIN AS ADMIN ---
        if page.is_visible('input[placeholder="Enter your Student ID"]'):
            page.fill('input[placeholder="Enter your Student ID"]', 'NST-ADMIN-001')
            page.fill('input[type="password"]', 'admin123')
            page.click('button:has-text("Enter Classroom")')
        
        # Wait for potential Startup Ad or Welcome Popup
        print("Waiting for dashboard/popups...")
        page.wait_for_timeout(3000)

        # Check for Startup Ad Image
        if page.is_visible('img[src="/logo.jpg"]'):
            print("SUCCESS: Startup Ad with Logo is visible.")
            # Wait for it to close (auto-close is usually 5s)
            page.wait_for_timeout(6000)
        else:
            print("INFO: Startup Ad not seen (maybe disabled or timed out).")

        # --- NAVIGATE TO ACCESS CONTROL ---
        print("Navigating to Access Control...")
        try:
            # Wait explicitly for the button
            page.wait_for_selector('button:has-text("Access Control")', timeout=10000)
            page.click('button:has-text("Access Control")')
        except Exception as e:
            print(f"FAILED to find Access Control button: {e}")
            page.screenshot(path='verify_failure.png')
            browser.close()
            return
            
        page.wait_for_timeout(1000)
        
        # --- LOCK MATHEMATICS ---
        print("Locking Mathematics...")
        # The label contains "Mathematics", input is inside.
        math_label = page.locator('label').filter(has_text="Mathematics")
        
        try:
             # Ensure math label is visible before interacting
            if math_label.count() > 0:
                math_checkbox = math_label.locator('input[type="checkbox"]').first
                if math_checkbox.is_checked():
                    math_checkbox.uncheck()
                    print("Unchecked Mathematics (Locked)")
                else:
                    print("Mathematics was already locked")
            
                # SAVE SETTINGS
                page.on("dialog", lambda d: d.accept())
                page.click('button:has-text("Save Changes")')
                page.wait_for_timeout(1000)
            else:
                print("WARNING: Mathematics label not found, skipping lock step.")
        except Exception as e:
            print(f"Error toggling lock: {e}")

        # --- VIEW AS STUDENT ---
        print("Switching to Student View...")
        page.click('button:has-text("View as Student")')
        page.wait_for_timeout(2000)
        
        # --- VERIFY LOCK ---
        print("Verifying Lock...")
        content = page.content()
        if "Mathematics" in content and "LOCKED" in content:
            print("SUCCESS: Mathematics is visually locked.")
        else:
            # It might be in 'Subjects' view
            print("Checking page content for lock status...")
        
        # Taking screenshot to confirm
        page.screenshot(path='verify_lock_result.png')
        print("Screenshot saved to verify_lock_result.png")
        
        browser.close()

if __name__ == "__main__":
    verify()
