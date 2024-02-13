import ReactQuill from "react-quill";

export default function Editor({ value, onChange }) {
	const modules = {
		toolbar: [
			[{ header: [1, 2, 3, 4, 5, 6, false] }],
			["bold", "italic", "underline", "strike", "blockquote"],
			[{ list: "ordered" }, { list: "bullet" }],
			["link", "image", "video"],
			["clean"],
		],
	};
	return (
		<ReactQuill
			value={value}
			onChange={onChange}
			theme={"snow"}
			modules={modules}
		/>
	);
}
