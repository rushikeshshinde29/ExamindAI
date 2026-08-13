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
 * Automates the logout flow on React UI:
 * - Logs in with test student credentials first.
 * - Wait for dashboard redirection.
 * - Clicks the Sign Out button (id="logout-btn").
 * - Verifies redirection back to the login page.
 */
public class LogoutFlowSeleniumTest {

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
    @DisplayName("Verify that an authenticated user can logout and redirect back to login page")
    public void testSuccessfulLogoutFlow() {
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

        // 3. Find and click Sign Out button
        WebElement logoutButton = wait.until(ExpectedConditions.elementToBeClickable(By.id("logout-btn")));
        logoutButton.click();

        // 4. Assert redirect back to login
        wait.until(ExpectedConditions.urlContains("/login"));
        String currentUrl = driver.getCurrentUrl();
        Assertions.assertTrue(currentUrl.contains("/login"), "Should redirect back to login page. Current URL: " + currentUrl);
    }
}
