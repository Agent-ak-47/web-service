package com.travelagency.package_service.dto;

/** Success envelope: { "data": ... } */
public record ApiResponse<T>(T data) {

    public static <T> ApiResponse<T> of(T data) {
        return new ApiResponse<>(data);
    }
}
