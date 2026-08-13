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

/**
 * SELENIUM TEST
 * Automates the login flow on React UI:
 * - Navigates to http://localhost:5173/login.
 * - Inputs dedicated test student credentials.
 * - Clicks sign-in and verifies redirect to /dashboard.
 */
public class LoginFlowSeleniumTest {

    private WebDriver driver;
    private WebDriverWait wait;
    private static final String BASE_URL = "http://localhost:5173";

    @BeforeEach
    public void setUp() {
        try {
            WebDriverManager.chromedriver().setup();
            ChromeOptions options = new ChromeOptions();
            options.addArguments("--headless=new"); // run headlessly for test environments
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
    @DisplayName("Verify that a valid user can successfully login and redirect to the dashboard")
    public void testSuccessfulLoginFlow() {
        if (driver == null) return;

        // Navigate to login
        driver.get(BASE_URL + "/login");

        // Fill in email
        WebElement emailInput = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("login-email")));
        emailInput.clear();
        emailInput.sendKeys("teststudent@examind.com");

        // Fill in password
        WebElement passwordInput = driver.findElement(By.id("login-password"));
        passwordInput.clear();
        passwordInput.sendKeys("testpassword123");

        // Click login
        WebElement submitButton = driver.findElement(By.id("login-submit"));
        submitButton.click();

        // Assert redirect to dashboard
        wait.until(ExpectedConditions.urlContains("/dashboard"));
        String currentUrl = driver.getCurrentUrl();
        Assertions.assertTrue(currentUrl.contains("/dashboard"), "Should redirect to dashboard. Current URL: " + currentUrl);
    }
}
