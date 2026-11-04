import {AdminTable} from "@/components/admin-table";
export default function Page(){return <><h1 className="mb-2 font-display text-3xl font-bold">Sermons</h1><p className="mb-7 text-navy-600">Manage sermons using your administrator account.</p><AdminTable table="wtlm_sermons"/></>}
