"use client";

import File from "@/components/UploadCard";
import { createClient } from "@/utils/supabase/client";
import { PutBlobResult } from "@vercel/blob";
import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import {
	Dispatch,
	SetStateAction,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

export default function Teacher() {
	const supabase = createClient();
	const router = useRouter();
	const inputFileRef = useRef<HTMLInputElement>(null);
	const [blob, setBlob] = useState<PutBlobResult | null>(null);
	const [message, setMessage] = useState("");
	const [uploads, setUploads] = useState<
		| null
		| []
		| [
				{
					filename: string;
					name: string;
					url: string;
				}
		  ]
		| {
				filename: string;
				name: string;
				url: string;
		  }[]
	>(null);
	const [user, setUser] = useState<{
		name: string;
		year_level: string;
		course: string;
	} | null>(null);

	const deleteFile = async (
		url: string,
		set: Dispatch<SetStateAction<boolean>>
	) => {
		set(true);
		const res = await fetch("/api/module/teacher/delete", {
			method: "DELETE",
			body: JSON.stringify({
				url: url,
			}),
		});
		const updated = uploads?.filter((val) => {
			return val.url != url;
		});
		if (typeof updated != "undefined") {
			setUploads(updated);
			set(false);
		}
	};

	const getUploads = useCallback(async () => {
		const res = await (
			await fetch("/api/module/teacher/list-ups", { method: "GET" })
		).json();

		if (!res.error) {
			setUploads(res.data);
		} else {
			setUploads([]);
		}
	}, [supabase]);

	const getUser = useCallback(async () => {
		const res = await (await fetch("/api/user", { method: "GET" })).json();
		if (!res.error) {
			setUser(res.data[0]);
		}
	}, [supabase]);

	useEffect(() => {
		getUploads();
		getUser();
		if (!supabase.auth.getUser()) {
			router.push("/");
		}
	}, [supabase]);

	return (
		<div
			id="backgroundPattern"
			className="w-full flex flex-col items-center absolute z-[10] p-2 lg:p-8 min-h-[100vh]"
		>
			<span className="mb-4 max-w-[92%] w-[92%] h-[6em] lg:h-[10em] flex flex-col justify-center flex-wrap font-light relative border-b-[3px] border-[#222222] lg:p-4 ">
					{user == null ? (
						<span id="loading" className="flex justify-center">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								height="24px"
								viewBox="0 -960 960 960"
								width="24px"
								fill="#222222"
							>
								<path d="M320-160h320v-120q0-66-47-113t-113-47q-66 0-113 47t-47 113v120Zm160-360q66 0 113-47t47-113v-120H320v120q0 66 47 113t113 47ZM160-80v-80h80v-120q0-61 28.5-114.5T348-480q-51-32-79.5-85.5T240-680v-120h-80v-80h640v80h-80v120q0 61-28.5 114.5T612-480q51 32 79.5 85.5T720-280v120h80v80H160Zm320-80Zm0-640Z" />
							</svg>
						</span>
					) : (
						<span className="flex flex-col justify-start py-4">
							<span className=" text-[2.5em] capitalize lg:text-[4em] font-[400] flex ">
								{user.name}
							</span>
							<span className=" gap-2 text-[1em] lg:text-[1.5em] font-[300] flex italic">
								<span>Course: </span>
								<span className="uppercase">{user.course}</span>
							</span>
						</span>
					)}
				</span>
			<div className="flex flex-wrap flex-row lg:justify-normal justify-center gap-[2.5%] py-2 my-2 border-[#00000000] w-[96%] lg:w-[92%] lg:border-gray-700/[0.7]">
				<div className="border-2 border-slate-200 rounded bg-white/[0.75] my-2 flex flex-col w-[92vw] lg:w-[30%] lg:p-6 p-2 lg:h-[30rem]">
					<div className="p-2 lg:p-4">
						<h1 className="flex justify-center items-center text-3xl border-b-gray-600 ">
							Upload a Module
						</h1>
					</div>
					<div className="flex flex-col w-auto justify-center flex-wrap h-auto p-2 lg:p-4 items-center">
						<form
							onSubmit={async (event) => {
								event.preventDefault();
								setMessage("Uploading");
								if (!inputFileRef.current?.files) {
									throw new Error("No file selected");
								}
								const file = inputFileRef.current.files[0];
								try {
									const newBlob = await upload(file.name, file, {
										access: "public",
										handleUploadUrl: "/api/module/teacher/upload",
									});
									if (newBlob) {
										const data = {
											url: newBlob.url,
											filename: file.name,
											name: user?.name,
										};
										const res = await fetch("/api/module/teacher/update", {
											body: JSON.stringify(data),
											method: "POST",
										});
										setBlob(newBlob);
										const updated = uploads;
										updated?.push(data as never);
										setUploads(updated);
										setMessage("File Uploaded");
									} else {
										setMessage("Upload Failed");
									}
								} catch (error) {
									if (
										(error as Error).message ==
										"Vercel Blob: Failed to  retrieve the client token"
									) {
										setMessage(
											"Upload Failed, Either the file exists or its not the correct type"
										);
									} else {
										setMessage(
											"Upload Failed, the file already exists or you are not authorized"
										);
									}
								} finally {
									setTimeout(() => {
										setMessage("");
									}, 5000);
								}
							}}
							className="flex justify-center flex-col items-center w-[80%]"
						>
							<input
								name="file"
								ref={inputFileRef}
								type="file"
								className=" bg-white border-gray-400 border-[1px] p-2 my-4 lg:m-4 rounded-2xl"
								accept="application/vnd.ms-excel, application/vnd.ms-powerpoint,
								text/plain, application/pdf, application/msword,
							application/vnd.openxmlformats-officedocument.wordprocessingml.document"
								required
							/>
							<button
								type="submit"
								className="bg-red-500 flex justify-center items-center w-[10em] transition-all ease fill-white mt-2 p-2 rounded-2xl text-white hover:bg-white hover:text-black hover:fill-black border-[#00000000] border-2 hover:border-red-500"
								disabled={message == "Uploading" ? true : false}
							>
								Upload
							</button>
						</form>
						<div className="text-xl font-light py-2 pl-4 pr-2 h-auto">
							<span
								id={`${message == "Uploading" ? "loading" : ""}`}
								className="flex w-full items-center justify-center"
							>
								{message == "Uploading" ? (
									<svg
										xmlns="http://www.w3.org/2000/svg"
										height="24px"
										viewBox="0 -960 960 960"
										width="24px"
										fill="#222222"
									>
										<path d="M320-160h320v-120q0-66-47-113t-113-47q-66 0-113 47t-47 113v120Zm160-360q66 0 113-47t47-113v-120H320v120q0 66 47 113t113 47ZM160-80v-80h80v-120q0-61 28.5-114.5T348-480q-51-32-79.5-85.5T240-680v-120h-80v-80h640v80h-80v120q0 61-28.5 114.5T612-480q51 32 79.5 85.5T720-280v120h80v80H160Zm320-80Zm0-640Z" />
									</svg>
								) : (
									message
								)}
							</span>
						</div>
					</div>
				</div>
				<div className=" border-slate-300 rounded bg-white/[0.65] flex flex-col my-2 p-4 w-[92vw] lg:w-[67.5%] lg:max-w-[70%] border-gray-500/[0.4]">
					<h1 className="text-3xl p-2 m-2 text-gray-800 border-b-2 border-b-gray-300">
						Your Modules
					</h1>
					<div className=" flex flex-wrap justify-center items-start gap-4 m-2 p-2 md:m-2 md:p-8 rounded-md border-2  border-gray-200">
						{uploads == null ? (
							// <span
							// 	id="loading"
							// 	className="flex w-full items-center justify-center "
							// >
							// 	<svg
							// 		xmlns="http://www.w3.org/2000/svg"
							// 		height="24px"
							// 		viewBox="0 -960 960 960"
							// 		width="24px"
							// 		fill="#222222"
							// 	>
							// 		<path d="M320-160h320v-120q0-66-47-113t-113-47q-66 0-113 47t-47 113v120Zm160-360q66 0 113-47t47-113v-120H320v120q0 66 47 113t113 47ZM160-80v-80h80v-120q0-61 28.5-114.5T348-480q-51-32-79.5-85.5T240-680v-120h-80v-80h640v80h-80v120q0 61-28.5 114.5T612-480q51 32 79.5 85.5T720-280v120h80v80H160Zm320-80Zm0-640Z" />
							// 	</svg>
							// </span>
							[0, 1, 2].map((n) => {
								return (
									<div
									key={n}
									className="loadingCard border-2 w-[80%] md:w-[28%] transition-all h-[6em] md:h-[10em] rounded-lg" 
								/>
								);
							})
						) : uploads.length == 0 ? (
							<div className="p-4 border-2 border-gray-200 bg-white">
								No Modules
							</div>
						) : (
							uploads.map((file) => {
								return (
									<File
										key={file.url}
										name={file.name}
										url={file.url}
										filename={file.filename}
										callback={deleteFile}
									/>
								);
							})
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
