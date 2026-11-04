import {AdminTable} from "@/components/admin-table";
export default function Page(){return <><h1 className="mb-2 font-display text-3xl font-bold">Service times</h1><p className="mb-7 text-navy-600">Edit weekly worship, Bible study and prayer schedules shown on the home page.</p><AdminTable table="wtlm_service_times"/></>}
