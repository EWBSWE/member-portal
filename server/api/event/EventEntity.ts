// TODO(dan) 27/01/19: The types listed below are not an exact match to their Database entry. This is sad. But also a
// step in the right direction!
export type EventEntity = {
	id: number
	name: string
	identifier: string
	active: boolean
	due_date: Date
	notification_open: boolean
	created_at: Date
	updated_at: Date
	email_template_id: number
}
