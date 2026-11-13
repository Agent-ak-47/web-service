package com.travelagency.package_service.media;

import com.travelagency.package_service.exception.ApiException;
import com.travelagency.package_service.exception.ErrorCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("ImageStorage")
class ImageStorageTest {

    private static final String BASE_URL = "http://localhost:8082";
    private static final byte[] PNG_BYTES = {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a};

    @TempDir
    Path tempDir;

    private ImageStorage storage() {
        return new ImageStorage(tempDir.resolve("uploads"));
    }

    private static String dataUrl(String mime, byte[] bytes) {
        return "data:" + mime + ";base64," + Base64.getEncoder().encodeToString(bytes);
    }

    @Test
    @DisplayName("stores a PNG data URL and returns its public URL")
    void storesPngDataUrl() throws Exception {
        // Act
        Object stored = storage().storeIfDataUrl(dataUrl("image/png", PNG_BYTES), BASE_URL + "/");

        // Assert
        assertThat(stored).isInstanceOf(String.class);
        String url = (String) stored;
        assertThat(url).matches(BASE_URL + "/uploads/[0-9a-f-]+\\.png");

        Path file = tempDir.resolve("uploads").resolve(url.substring(url.lastIndexOf('/') + 1));
        assertThat(Files.readAllBytes(file)).isEqualTo(PNG_BYTES);
    }

    @ParameterizedTest(name = "{0} -> .{1}")
    @CsvSource({"image/jpeg, jpg", "image/webp, webp"})
    @DisplayName("maps every accepted MIME type to its extension")
    void mapsAcceptedMimeTypes(String mime, String extension) {
        // Act
        Object stored = storage().storeIfDataUrl(dataUrl(mime, new byte[] {1, 2, 3}), BASE_URL);

        // Assert
        assertThat((String) stored).endsWith("." + extension);
    }

    @Test
    @DisplayName("leaves values that are not data URLs unchanged")
    void leavesNonDataUrlsUnchanged() {
        // Arrange
        ImageStorage storage = storage();

        // Act / Assert
        assertThat(storage.storeIfDataUrl(null, BASE_URL)).isNull();
        assertThat(storage.storeIfDataUrl("", BASE_URL)).isEqualTo("");
        assertThat(storage.storeIfDataUrl("imgs/package-1.jpg", BASE_URL))
                .isEqualTo("imgs/package-1.jpg");
        assertThat(storage.storeIfDataUrl("https://cdn.example.com/a.png", BASE_URL))
                .isEqualTo("https://cdn.example.com/a.png");
        assertThat(tempDir.resolve("uploads")).doesNotExist();
    }

    @Test
    @DisplayName("rejects an unsupported MIME type")
    void rejectsUnsupportedMimeType() {
        // Act / Assert
        assertThatThrownBy(() -> storage().storeIfDataUrl(dataUrl("image/gif", PNG_BYTES), BASE_URL))
                .isInstanceOfSatisfying(ApiException.class, exception -> {
                    assertThat(exception.getCode()).isEqualTo(ErrorCode.INVALID_FORMAT);
                    assertThat(exception.getDetails()).containsKey("imageUrl");
                });
    }

    @Test
    @DisplayName("rejects an invalid base64 payload")
    void rejectsMalformedDataUrl() {
        // Act / Assert
        assertThatThrownBy(() -> storage().storeIfDataUrl("data:image/png;base64,not*base64", BASE_URL))
                .isInstanceOfSatisfying(ApiException.class,
                        exception -> assertThat(exception.getCode()).isEqualTo(ErrorCode.INVALID_FORMAT));
    }

    @Test
    @DisplayName("rejects an image larger than 2 MB")
    void rejectsImageLargerThanTwoMegabytes() {
        // Arrange
        byte[] tooLarge = new byte[2 * 1024 * 1024 + 1];

        // Act / Assert
        assertThatThrownBy(() -> storage().storeIfDataUrl(dataUrl("image/png", tooLarge), BASE_URL))
                .isInstanceOfSatisfying(ApiException.class, exception -> {
                    assertThat(exception.getCode()).isEqualTo(ErrorCode.INVALID_FORMAT);
                    assertThat(exception.getMessage()).contains("2 MB");
                });
    }

}
