// When objects are used within the authenticated backend walls we can use
// formatResponse to pass sensitive stuff like emails and such. If objects
// are to be shared to everyone, use formatPublicResponse instead.
export interface Formattable {
	formatResponse(): any
}

export interface PublicFormattable {
	formatPublicResponse(): any
}
