import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-zod";
import * as tables from "./schema";

/**
 * Gets the Zod schema for a table
 * @param table - The name of the table to get the schema for
 * @returns The (create, select and update) Zod schemas for the table
 */
export const getZodSchema = (table: string) => {
	if (!tables[table as keyof typeof tables]) {
		throw new Error(`Table ${table} not found`);
	}

	// don't include relations
	const _tables: Record<string, any> = {};
	Object.entries(tables).forEach(([name, t]) => {
		const isRelation = Object.hasOwn(t, "config") && Object.hasOwn(t, "table");
		if (!isRelation) {
			_tables[name] = t;
		}
	});

	const schema = _tables[table];
	const insertSchema = createInsertSchema(schema);
	const updateSchema = createUpdateSchema(schema);
	const selectSchema = createSelectSchema(schema);
	return {
		insert: insertSchema,
		update: updateSchema,
		select: selectSchema,
	};
};

getZodSchema("users");
