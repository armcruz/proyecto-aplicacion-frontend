import { useContext, useRef, useEffect, useState } from 'react';
import { AuthContext } from '../../context/auth/AuthContext';
import { AppContext } from '../../context/app/AppContext';
import apiClient from '../../config/axios';
import Layout from '../../components/Layout';
import Alert from '../../components/Alert';

export async function getServerSideProps({ params }) {
	const { slug } = params;
	const resp = await apiClient.get(`/links/${slug}`);
	return {
		props: {
			filename: resp.data.filename,
			password: resp.data.password,
			url: resp.data.url,
		},
	};
}

export async function getServerSidePaths() {
	const resp = await apiClient.get('/links');
	return {
		paths: resp.data.links.map((link) => ({
			params: { slug: link.url },
		})),
		fallback: false,
	};
}

function Link({ filename, password, url }) {
	const { getAuthUser } = useContext(AuthContext);
	const { showAlert, alertMessage } = useContext(AppContext);
	const [hasPassword, setHasPassword] = useState(password);
	const [downloadsExceed, setDownloadExceed] = useState(false);

	const passwordRef = useRef();

	useEffect(() => {
		const token = window.localStorage.getItem('nodesend:token');
		if (token) {
			getAuthUser();
		}
	}, []);

	const handleVerifyPassword = async (e) => {
		e.preventDefault();
		const _password = passwordRef.current.value;
		if (!_password.trim()) return;
		try {
			const resp = await apiClient.post(`/links/${url}`, {
				password: _password,
			});
			console.log(resp.data);

			if (resp.data.success) {
				setHasPassword(false);
			}
		} catch (err) {
			showAlert(err.response.data.msg);
		}
		if (password.current) {
			passwordRef.current.value = '';
		}
	};

	const handleDownload = async (e) => {
		e.preventDefault();
		try {
			const resp = await apiClient.get(`/files/${filename}/exists`);
			if (!resp.data.success) return;
			const anchor = window.document.createElement('a');
			anchor.href = `${process.env.API_URL}/files/${filename}`;
			window.document.body.appendChild(anchor);
			anchor.click();
			anchor.remove();
		} catch (err) {
			console.log(err);
			setDownloadExceed(true);
		}
	};

	if (downloadsExceed) {
		return (
			<Layout>
				<h1 className="text-2xl text-center text-gray-700">
					El archivo ha superado el límite de descargas establecido
					por el autor
				</h1>
			</Layout>
		);
	}

	return (
		<Layout>
			{hasPassword ? (
				<>
					<p className="md:text-2xl text-center">
						El enlace está protegido, escribe la contraseña para
						poder descargarlo
					</p>
					{alertMessage && <Alert message={alertMessage} />}
					<div className="flex justify-center mt-5">
						<div className="w-full max-w-lg">
							<form
								className="bg-white rounded shadow-md px-8 pt-6 pb-8 mb-4"
								onSubmit={handleVerifyPassword}
							>
								<div className="mb-4">
									<label
										className="block text-black text-sm font-bold mb-2"
										htmlFor="password"
									>
										Contraseña
									</label>
									<input
										className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring"
										type="password"
										id="password"
										ref={passwordRef}
									/>
								</div>
								<input
									type="submit"
									value="Comprobar"
									className="bg-red-500 hover:bg-gray-900 w-full p-2 text-white uppercase font-bold"
								/>
							</form>
						</div>
					</div>
				</>
			) : (
				<>
					{alertMessage && <Alert message={alertMessage} />}

					<h1 className="text-4xl text-center text-gray-700">
						Descarga tu archivo
					</h1>
					<div className="flex items-center justify-center mt-10">
						<button
							onClick={handleDownload}
							className="bg-red-500 text-center px-10 py-3 rounded uppercase font-bold text-white cursor-pointer"
						>
							Descargar
						</button>
					</div>
				</>
			)}
		</Layout>
	);
}

export default Link;