/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import axiosPrivate from "../api/axios";
import { useEffect } from "react";
import UseRefreshToken from "./useRefreshToken";
import UseAuth from "./useAuth";

/**
 * Custom hook that returns an axios instance pre-wired for authenticated
 * requests. It attaches two interceptors so components can just call
 * axiosPrivate.get(...) without worrying about tokens or expiry.
 *
 * Request interceptor:
 *   Attaches the current in-memory access token as
 *   "Authorization: Bearer <token>" on every outgoing request (unless the
 *   caller already set it themselves).
 *
 * Response interceptor:
 *   If the server responds 403 (access token expired), we hit the /auth
 *   refresh endpoint to get a new access token, then retry the original
 *   request exactly once. The `prevRequest.sent` flag prevents an infinite
 *   retry loop if the refresh itself keeps failing.
 *
 * The end result: from the user's perspective, sessions "just work" for as
 * long as the refresh cookie is valid — the token dance is invisible.
 */
export default function UseAxiosPrivte() {
	const refresh = UseRefreshToken();
	const { auth } = UseAuth();

	/*
	 *    Interceptors are methods which are triggered before or after the main method. There are two types of interceptors:
	 *        request interceptor: - It allows you to write or execute a piece of your code before the request gets sent.
	 *        response interceptor: - It allows you to write or execute a piece of your code before response reaches the calling end.
	 */
	useEffect(() => {
		//console.log("in use axios private");
		const requestIntercept = axiosPrivate.interceptors.request.use(
			(config) => {
				// if the headers dont exist , its the inital request
				if (!config.headers["Authorization"]) {
					config.headers["Authorization"] = `Bearer ${auth?.accessToken}`;
				}
				return config;
			},
			(error) => Promise.reject(error)
		);

		const responseIntercept = axiosPrivate.interceptors.response.use(
			(response) => response,
			// if our token is expired
			async (error) => {
				const prevRequest = error?.config;
				if (error?.response?.status === 403 && !prevRequest?.sent) {
					// only want to retry once , the sent property indicates that
					prevRequest.sent = true;
					const newAccessToken = await refresh();
					//console.log(`inAxiosPrivate: new token => ${newAccessToken}`);
					prevRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
					//updated the request with new token, try request again
					return axiosPrivate(prevRequest);
				}
				return Promise.reject(error);
			}
		);

		return () => {
			// remove interceptor when done
			axiosPrivate.interceptors.response.eject(responseIntercept);
			axiosPrivate.interceptors.request.eject(requestIntercept);
		};
	}, [auth, refresh]);

	return axiosPrivate;
}
