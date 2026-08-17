import { db, dataSourcesTable, ledgerAccounts, transactionsTable, type LedgerAccount } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface ParsedLedgerRow {
  occurredOn: Date;
  account: LedgerAccount;
  category: string;
  description: string;
  amountCents: number;
}

export class LedgerImportError extends Error {}

const EXPECTED_HEADER = ["date", "account", "category", "description", "amount"];

/**
 * Parses a CSV ledger export with the header:
 *   date,account,category,description,amount
 * `account` must be one of: revenue, cogs, opex, cash. `amount` is in dollars.
 * For cogs/opex, only the magnitude matters — whether your export signs
 * costs as negative (a reduction) or positive, both are treated as a cost
 * amount. Stored internally as integer cents.
 */
export function parseLedgerCsv(csvText: string): ParsedLedgerRow[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    throw new LedgerImportError("The file is empty.");
  }

  const header = lines[0]!.split(",").map((cell) => cell.trim().toLowerCase());
  if (header.join(",") !== EXPECTED_HEADER.join(",")) {
    throw new LedgerImportError(`Expected header "${EXPECTED_HEADER.join(",")}", got "${header.join(",")}".`);
  }

  const rows: ParsedLedgerRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]!);
    if (cells.length !== EXPECTED_HEADER.length) {
      throw new LedgerImportError(`Row ${i + 1} has ${cells.length} columns, expected ${EXPECTED_HEADER.length}.`);
    }
    const [dateStr, accountStr, category, description, amountStr] = cells;

    const occurredOn = new Date(dateStr!);
    if (Number.isNaN(occurredOn.getTime())) {
      throw new LedgerImportError(`Row ${i + 1}: invalid date "${dateStr}". Use YYYY-MM-DD.`);
    }

    const account = accountStr!.trim().toLowerCase();
    if (!ledgerAccounts.includes(account as LedgerAccount)) {
      throw new LedgerImportError(`Row ${i + 1}: account must be one of ${ledgerAccounts.join(", ")}, got "${accountStr}".`);
    }

    const amount = Number(amountStr);
    if (Number.isNaN(amount)) {
      throw new LedgerImportError(`Row ${i + 1}: invalid amount "${amountStr}".`);
    }

    rows.push({
      occurredOn,
      account: account as LedgerAccount,
      category: category!.trim() || "Uncategorized",
      description: description!.trim() || "—",
      amountCents: Math.round(amount * 100),
    });
  }

  return rows;
}

function splitCsvLine(line: string): string[] {
  // Minimal CSV split supporting double-quoted cells containing commas.
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

/** Stores parsed rows against a data source and updates its sync status. */
export async function importLedgerRows(workspaceId: string, dataSourceId: string, rows: ParsedLedgerRow[]): Promise<void> {
  try {
    if (rows.length > 0) {
      await db.insert(transactionsTable).values(
        rows.map((row) => ({
          workspaceId,
          dataSourceId,
          occurredOn: row.occurredOn,
          account: row.account,
          category: row.category,
          description: row.description,
          amountCents: row.amountCents,
        })),
      );
    }

    await db
      .update(dataSourcesTable)
      .set({ status: "ready", lastSyncAt: new Date(), rowCount: rows.length, errorMessage: null })
      .where(eq(dataSourcesTable.id, dataSourceId));
  } catch (error) {
    await db
      .update(dataSourcesTable)
      .set({ status: "error", errorMessage: error instanceof Error ? error.message : "Import failed." })
      .where(eq(dataSourcesTable.id, dataSourceId));
    throw error;
  }
}
