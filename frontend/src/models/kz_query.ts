export type KzQueryParams = Record<string, string>;


export function cleanQueryParams(values: KzQueryParams): KzQueryParams {
    const params: KzQueryParams = {};

    for (const [name, value] of Object.entries(values)) {
        const clean = value.trim();

        if (clean.length > 0) {
            params[name] = clean;
        }
    }

    return params;
}


export function addQuery(url: string, params: KzQueryParams): string {
    const query = new URLSearchParams(params).toString();

    return query.length > 0 ? `${url}?${query}` : url;
}
