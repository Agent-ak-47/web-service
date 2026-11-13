package com.travelagency.package_service.media;

import com.travelagency.package_service.exception.ApiException;
import com.travelagency.package_service.exception.ErrorCode;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Stores the cover image sent by the admin form. The Angular upload component
 * sends a {@code data:image/...;base64,...} value, which is written once as
 * {@code uploads/<uuid>.<ext>}; only the public URL is kept in the database.
 */
@Component
public class ImageStorage {

    private static final Pattern DATA_URL =
            Pattern.compile("^data:(image/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$");
    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/png", "png",
            "image/jpeg", "jpg",
            "image/webp", "webp");
    private static final int MAX_BYTES = 2 * 1024 * 1024;

    private final Path directory;

    public ImageStorage() {
        this(Paths.get(System.getenv().getOrDefault("UPLOADS_DIR", "uploads")));
    }

    ImageStorage(Path directory) {
        this.directory = directory.toAbsolutePath().normalize();
    }

    public Path directory() {
        return directory;
    }

    /**
     * Persists a data-URL image and returns its absolute public URL. Values that
     * are not data URLs (empty, seed paths, already stored URLs) are unchanged.
     */
    public Object storeIfDataUrl(Object raw, String baseUrl) {
        if (!(raw instanceof String value) || !value.startsWith("data:")) {
            return raw;
        }

        Matcher matcher = DATA_URL.matcher(value.trim());

        if (!matcher.matches()) {
            throw invalid("The image must be a PNG, JPEG or WEBP file.");
        }

        byte[] bytes;

        try {
            bytes = Base64.getDecoder().decode(matcher.group(2));
        }
        catch (IllegalArgumentException exception) {
            throw invalid("The image could not be decoded.");
        }

        if (bytes.length == 0 || bytes.length > MAX_BYTES) {
            throw invalid("The image must not exceed 2 MB.");
        }

        String fileName = UUID.randomUUID() + "." + EXTENSIONS.get(matcher.group(1));

        try {
            Files.createDirectories(directory);
            Files.write(directory.resolve(fileName), bytes);
        }
        catch (IOException exception) {
            throw new ApiException(ErrorCode.INTERNAL_ERROR, "The image could not be stored.");
        }

        String origin = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;

        return origin + "/uploads/" + fileName;
    }

    private static ApiException invalid(String message) {
        return new ApiException(ErrorCode.INVALID_FORMAT, message, Map.of("imageUrl", message));
    }
}
