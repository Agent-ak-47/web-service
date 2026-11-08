package com.travelagency.package_service.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("TokenHasher")
class TokenHasherTest {

    @ParameterizedTest(name = "sha256(\"{0}\")")
    @DisplayName("Returns the SHA-256 as lowercase hex, like hashlib.sha256().hexdigest()")
    @CsvSource({
            "abc,   ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
            "token, 3c469e9d6c5875d37a43f353d4f88e61fcf812c66eee3457465a40b0da4153e0",
            "'',    e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    })
    void sha256Hex_knownInput_returnsKnownDigest(String input, String expected) {
        assertThat(TokenHasher.sha256Hex(input)).isEqualTo(expected);
    }

    @Test
    @DisplayName("The hash fits the CHAR(64) token_hash column and is lowercase")
    void sha256Hex_jwtLikeToken_is64LowercaseHexChars() {
        // Arrange
        String token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signature";

        // Act
        String hash = TokenHasher.sha256Hex(token);

        // Assert
        assertThat(hash).hasSize(64).matches("[0-9a-f]{64}");
        assertThat(TokenHasher.sha256Hex(token)).isEqualTo(hash);
    }
}
