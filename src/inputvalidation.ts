export function isValidExtension(input: string): boolean {
    return /^[\w-]+$/.test(input);
}

// export function isValidTag(input: string): boolean {
//     return /^#[\w-]+$/.test(input);
// }

// export function isValidOmittedTag(input: string): boolean {
//     return /^[\w-]+$/.test(input);
// }

/*
 * The code below is partially adopted from (https://github.com/mofukuru/auto_file_organizer/issues/8) by vecerap.
 */

export function getSanitizedTag(input: string): string {
    // matches hiarchical tag structure with ASCII and UNICODE word characters,
    // numbers and dashes with one or more prefixed #
    const regex = /^#*(([\p{L}\p{N}-])+\/)*(([\p{L}\p{N}-])+)$/u;

    if (!regex.test(input)) return "";

    return "#" + input.replace(/^#+/, "");
}
