from playwright.sync_api import sync_playwright

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:5173')
        
        # --- LOGIN AS ADMIN ---
        page.fill('input[placeholder="Enter your Student ID"]', 'NST-ADMIN-001')
        page.fill('input[type="password"]', 'admin123')
        page.click('button:has-text("Enter Classroom")')
        page.wait_for_timeout(2000)
        
        # --- NAVIGATE TO PAYMENTS CONFIG ---
        page.click('text=Payment')
        page.wait_for_timeout(1000)
        
        # --- SCREENSHOT ADMIN CONFIG ---
        page.screenshot(path='admin_subscription_config.png')
        print("Admin Config Screenshot taken")
        
        # --- CREATE A SUBSCRIPTION PLAN ---
        page.fill('input[placeholder="Gold Pass"]', 'Golden Access')
        page.fill('input[value="499"]', '1000') # Original Price
        page.fill('input[value="199"]', '500')  # Sale Price
        page.click('button:has-text("Add Plan")')
        page.wait_for_timeout(1000)
        
        # --- EXIT ADMIN ---
        page.click('text=Exit')
        page.click('text=Exit Console')
        page.wait_for_timeout(1000)
        
        # --- LOGIN AS STUDENT ---
        page.fill('input[placeholder="Enter your Student ID"]', 'NST-STU-001')
        page.fill('input[type="password"]', 'student123')
        page.click('button:has-text("Enter Classroom")')
        page.wait_for_timeout(2000)
        
        # --- CHECK STORE ---
        page.click('text=Store')
        page.wait_for_timeout(1000)
        
        # --- SCREENSHOT STUDENT STORE ---
        page.screenshot(path='student_subscription_store.png')
        print("Student Store Screenshot taken")
        
        browser.close()

if __name__ == "__main__":
    verify()
