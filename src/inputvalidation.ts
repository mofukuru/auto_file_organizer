export function isValidExtension(input: string): boolean {
    return /^[\w-]+$/.test(input);
}

export function isValidTag(input: string): boolean {
    return /^#[\w-]+$/.test(input);
}

export function isValidOmittedTag(input: string): boolean {
    return /^[\w-]+$/.test(input);
}
