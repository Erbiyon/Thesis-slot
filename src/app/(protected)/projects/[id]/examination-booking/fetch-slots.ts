"use server";

import { getAvailableExaminationSlots } from "@/lib/slot-calculator";

export async function fetchSlotsAction(
  projectId: string,
  dateStr: string,
  academicTermId: string
) {
  return await getAvailableExaminationSlots({
    projectId,
    dateStr,
    academicTermId,
  });
}
