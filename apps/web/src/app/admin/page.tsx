import { DashboardHeader } from "./_components/dashboard/dashboard-header";
import { FadeIn } from "./_components/dashboard/fade-in";
import { GrowthTrendCard } from "./_components/dashboard/growth-trend/growth-trend-card";
import { RecentMembersCard } from "./_components/dashboard/members/recent-members-card";
import { OpsPulseStrip } from "./_components/dashboard/ops-pulse-strip";
import { StatCardsRow } from "./_components/dashboard/stat-cards-row";
import { UsageDistributionCard } from "./_components/dashboard/usage-distribution/usage-distribution-card";

const AdminPage = () => {
	return (
		// min-w-0: grid/flex children default to min-width:auto and can blow past the viewport
		<div className="mx-auto w-full min-w-0 max-w-[1600px] space-y-4 px-3 py-3 sm:space-y-5 sm:px-6 sm:py-6 lg:space-y-6 lg:px-8">
			<FadeIn>
				<DashboardHeader />
			</FadeIn>
			<FadeIn delay={0.04}>
				<OpsPulseStrip />
			</FadeIn>
			<FadeIn delay={0.08}>
				<StatCardsRow />
			</FadeIn>
			<div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-12">
				<FadeIn delay={0.12} className="min-w-0 xl:col-span-8">
					<GrowthTrendCard />
				</FadeIn>
				<FadeIn delay={0.16} className="min-w-0 xl:col-span-4">
					<UsageDistributionCard />
				</FadeIn>
			</div>
			<FadeIn delay={0.2} className="min-w-0">
				<RecentMembersCard />
			</FadeIn>
		</div>
	);
};

export default AdminPage;
