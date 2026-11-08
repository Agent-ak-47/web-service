package com.travelagency.package_service.dto;

import java.util.List;

/** Paginated list: { data: [...], page, size, total, totalPages } (page starts at 1). */
public record PageResponse<T>(List<T> data, int page, int size, long total, int totalPages) {
}
