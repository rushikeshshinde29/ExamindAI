package com.examind.ai.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.examind.ai.exception.CustomException;
import com.examind.ai.service.FileStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@Service
public class FileStorageServiceImpl implements FileStorageService {

    private static final Logger logger = LoggerFactory.getLogger(FileStorageServiceImpl.class);

    @Value("${cloudinary.url:}")
    private String cloudinaryUrl;

    private final Path fileStorageLocation;
    private Cloudinary cloudinary;

    public FileStorageServiceImpl() {
        // Local upload storage directory: 'uploads' under the execution working directory
        this.fileStorageLocation = Paths.get("uploads")
                .toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (IOException ex) {
            throw new CustomException("Could not create the directory where the uploaded files will be stored.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private Cloudinary getCloudinary() {
        if (cloudinary == null && cloudinaryUrl != null && !cloudinaryUrl.isBlank() && !cloudinaryUrl.contains("dummy")) {
            try {
                cloudinary = new Cloudinary(cloudinaryUrl);
                logger.info("Successfully initialized Cloudinary client using provided URL configuration.");
            } catch (Exception e) {
                logger.error("Failed to initialize Cloudinary client: {}", e.getMessage());
            }
        }
        return cloudinary;
    }

    @Override
    public String storeFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new CustomException("Cannot store empty file.", HttpStatus.BAD_REQUEST);
        }

        String originalFileName = file.getOriginalFilename();
        String extension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            extension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }
        String fileName = UUID.randomUUID().toString() + extension;

        // Try Cloudinary if URL is configured
        Cloudinary cloudinaryClient = getCloudinary();
        if (cloudinaryClient != null) {
            try {
                logger.info("Uploading file '{}' to Cloudinary...", originalFileName);
                Map uploadResult = cloudinaryClient.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
                String secureUrl = (String) uploadResult.get("secure_url");
                if (secureUrl != null) {
                    logger.info("Successfully uploaded to Cloudinary: {}", secureUrl);
                    return secureUrl;
                }
            } catch (Exception e) {
                logger.error("Cloudinary upload failed: {}. Falling back to local storage.", e.getMessage());
            }
        }

        // Fallback: Local Storage
        try {
            logger.info("Storing file '{}' locally as '{}'...", originalFileName, fileName);
            Path targetLocation = this.fileStorageLocation.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            
            // Return relative path. Since backend servlet path is '/api',
            // and we will configure a resource handler, `/api/uploads/filename` serves the file.
            return "/api/uploads/" + fileName;
        } catch (IOException ex) {
            throw new CustomException("Could not store file " + originalFileName + ". Please try again!", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
