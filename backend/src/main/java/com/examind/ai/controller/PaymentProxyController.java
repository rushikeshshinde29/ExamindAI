package com.examind.ai.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/payments")
public class PaymentProxyController {

    private static final Logger logger = LoggerFactory.getLogger(PaymentProxyController.class);

    @Value("${app.payment-service.url:http://localhost:5001/api/payments}")
    private String paymentServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @RequestMapping(value = "/**")
    public ResponseEntity<?> proxy(
            @RequestBody(required = false) String body,
            HttpMethod method,
            HttpServletRequest request) throws URISyntaxException {

        // Get the path suffix
        String requestURI = request.getRequestURI();
        String contextPath = request.getContextPath();
        String path = requestURI.substring(contextPath.length() + "/payments".length());
        
        String targetUrl = paymentServiceUrl + path;
        if (request.getQueryString() != null) {
            targetUrl += "?" + request.getQueryString();
        }

        logger.info("Proxying request [{} {}] -> target [{}]", method, requestURI, targetUrl);

        // Forward headers
        HttpHeaders headers = new HttpHeaders();
        Collections.list(request.getHeaderNames()).forEach(headerName -> {
            // Copy all headers except content-length which gets recalculated automatically
            if (!headerName.equalsIgnoreCase("content-length")) {
                headers.add(headerName, request.getHeader(headerName));
            }
        });

        HttpEntity<String> httpEntity = new HttpEntity<>(body, headers);

        try {
            return restTemplate.exchange(new URI(targetUrl), method, httpEntity, byte[].class);
        } catch (HttpStatusCodeException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .headers(e.getResponseHeaders())
                    .body(e.getResponseBodyAsByteArray());
        } catch (Exception e) {
            logger.error("Proxy error: {}", e.getMessage(), e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Payment microservice is unreachable: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(errorResponse);
        }
    }
}
