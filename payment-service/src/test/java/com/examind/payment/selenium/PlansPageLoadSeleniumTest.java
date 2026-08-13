package com.examind.payment.selenium;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.junit.jupiter.api.*;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.List;

/**
 * SELENIUM TEST
 * Automates checking the Plans page loads successfully:
 * - Logs in with test student credentials first.
 * - Navigates to http://localhost:5173/plans (by clicking id="nav-plans").
 * - Wait for elements with class name "card" (plan cards) to load.
 * - Asserts that the plan cards are visible on the page.
 */
public class PlansPageLoadSeleniumTest {

    private WebDriver driver;
    private WebDriverWait wait;
    private static final String BASE_URL = "http://localhost:5173";

    @BeforeEach
    public void setUp() {
        try {
            WebDriverManager.chromedriver().setup();
            ChromeOptions options = new ChromeOptions();
            options.addArguments("--headless=new");
            options.addArguments("--disable-gpu");
            options.addArguments("--no-sandbox");
            options.addArguments("--disable-dev-shm-usage");
            options.addArguments("--window-size=1920,1080");
            
            driver = new ChromeDriver(options);
            driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
            wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        } catch (Exception e) {
            System.err.println("WARNING: Could not initialize ChromeDriver: " + e.getMessage());
            Assumptions.assumeTrue(false, "Skipping test since Chrome/ChromeDriver could not be initialized");
        }
    }

    @AfterEach
    public void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    @DisplayName("Verify that the Plans page load displays plan cards")
    public void testPlansPageLoadsSuccessfully() {
        if (driver == null) return;

        // 1. Perform Login
        driver.get(BASE_URL + "/login");

        WebElement emailInput = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("login-email")));
        emailInput.sendKeys("teststudent@examind.com");

        WebElement passwordInput = driver.findElement(By.id("login-password"));
        passwordInput.sendKeys("testpassword123");

        WebElement submitButton = driver.findElement(By.id("login-submit"));
        submitButton.click();

        // 2. Wait for Dashboard redirection
        wait.until(ExpectedConditions.urlContains("/dashboard"));

        // 3. Click upgrade plan link
        WebElement navPlansLink = wait.until(ExpectedConditions.elementToBeClickable(By.id("nav-plans")));
        navPlansLink.click();

        // 4. Assert URL changed to plans
        wait.until(ExpectedConditions.urlContains("/plans"));

        // 5. Verify presence of plan cards (elements with class name "card")
        wait.until(ExpectedConditions.presenceOfElementLocated(By.className("card")));
        List<WebElement> planCards = driver.findElements(By.className("card"));
        
        Assertions.assertFalse(planCards.isEmpty(), "Plans page should load at least one plan card");
        
        // Verify plans text is loaded
        boolean hasPlansText = driver.findElement(By.tagName("body")).getText().contains("Choose Your Plan")
                || driver.findElement(By.tagName("body")).getText().contains("Premium Experience")
                || driver.findElement(By.tagName("body")).getText().contains("Active");
        Assertions.assertTrue(hasPlansText, "Plans page should display pricing header text");
    }
}
