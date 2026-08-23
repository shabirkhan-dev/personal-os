"use client";

import { TaskDone01Icon } from "@hugeicons/core-free-icons";
import {
	ModulePageHeader,
	RoutineManager,
	useArchiveRoutineMutation,
	useCreateRoutineMutation,
	useRoutinesQuery,
	useUpdateRoutineMutation,
} from "@/modules/routines";

export default function AdminRoutinesPage() {
	const { data: routines, isLoading } = useRoutinesQuery();
	const createMutation = useCreateRoutineMutation();
	const updateMutation = useUpdateRoutineMutation();
	const archiveMutation = useArchiveRoutineMutation();

	return (
		<div>
			<ModulePageHeader
				eyebrow="Personal OS"
				title="Routines"
				description="Build the daily and weekly rituals that make up your life."
				icon={TaskDone01Icon}
			/>
			<div className="mx-auto w-full max-w-[820px] px-3 py-5 sm:px-6 lg:px-8">
				<RoutineManager
					routines={routines}
					loading={isLoading}
					createPending={createMutation.isPending}
					updatePending={updateMutation.isPending}
					onCreate={createMutation.mutateAsync}
					onUpdate={(id, input) => updateMutation.mutateAsync({ id, input })}
					onArchive={(id) => archiveMutation.mutateAsync(id)}
				/>
			</div>
		</div>
	);
}
