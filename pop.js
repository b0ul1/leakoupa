const g_api_url = "https://api.keysco.re/search";

const g_k_a = "MWM2MmFmYWE1YzVi";
const g_k_b = "MGI2ZjMwYmQ5MWE2M2U3NmE4Yzll";
const g_k_c = "MmU0M2YxYjU2YzI1OTNhMGU4YTc5OTFmNmQ2MDM2Mg==";

const g_field_config = {
	email: {
		label: "Email",
		types: ["email"],
		placeholder: "ex: [email protected]"
	},
	login: {
		label: "Login",
		types: ["email"],
		placeholder: "ex: login / identifiant"
	},
	password: {
		label: "Password",
		types: ["password"],
		placeholder: "ex: password123"
	},
	email_domain: {
		label: "@ Domaine",
		types: ["email_domain"],
		placeholder: "ex: @example.com"
	},
	url: {
		label: "URL / Domaine",
		types: ["url"],
		placeholder: "ex: example.com"
	},
	username: {
		label: "Username",
		types: ["username"],
		placeholder: "ex: johndoe"
	},
	discord_id: {
		label: "Discord ID",
		types: ["discord_id"],
		placeholder: "ex: 123456789012345678"
	},
	phone: {
		label: "Téléphone",
		types: ["phone"],
		placeholder: "ex: +33123456789"
	},
	name: {
		label: "Nom",
		types: ["name"],
		placeholder: "ex: John Doe"
	},
	uuid: {
		label: "UUID",
		types: ["uuid"],
		placeholder: "ex: 550e8400-e29b-41d4-a716-446655440000"
	},
	ip: {
		label: "IP",
		types: [],
		placeholder: ""
	}
};

let g_current_field = null;

function get_api_key() {
	let base64;
	let decoded;

	base64 = g_k_a + g_k_b + g_k_c;
	try {
		decoded = atob(base64);
	} catch (e) {
		decoded = "";
	}
	return decoded;
}

function set_status(text, is_error) {
	const status_el = document.getElementById("status");

	status_el.textContent = text || "";
	if (is_error) {
		status_el.classList.add("error");
	} else {
		status_el.classList.remove("error");
	}
}

function clear_results() {
	const results_el = document.getElementById("results");
	const meta_el = document.getElementById("results-meta");

	results_el.innerHTML = "";
	meta_el.textContent = "";
	meta_el.classList.add("hidden");
}

function open_input_panel(field_key) {
	const config = g_field_config[field_key];
	const panel = document.getElementById("input-panel");
	const label = document.getElementById("input-label");
	const input = document.getElementById("search-input");

	if (!config) {
		return;
	}
	g_current_field = field_key;
	label.textContent = "Valeur pour " + config.label;
	input.placeholder = config.placeholder || "";
	input.value = "";
	panel.classList.remove("hidden");
	input.focus();
}

function close_input_panel() {
	const panel = document.getElementById("input-panel");

	g_current_field = null;
	panel.classList.add("hidden");
}

function render_group(source_name, entries) {
	const wrapper = document.createElement("div");
	const title = document.createElement("div");

	wrapper.className = "result-group";
	title.className = "result-group-title";
	title.textContent = source_name;
	wrapper.appendChild(title);
	if (!entries || !entries.length) {
		const empty = document.createElement("div");

		empty.className = "result-empty";
		empty.textContent = "no record in source";
		wrapper.appendChild(empty);
		return wrapper;
	}
	entries.forEach(function (entry) {
		const card = create_result_card(entry);

		wrapper.appendChild(card);
	});
	return wrapper;
}

function create_result_card(entry) {
	const card = document.createElement("div");
	const keys = Object.keys(entry);

	card.className = "result-card";
	if (!keys.length) {
		const empty = document.createElement("div");

		empty.className = "result-empty";
		empty.textContent = "empty input";
		card.appendChild(empty);
		return card;
	}
	keys.forEach(function (key) {
		const value = entry[key];
		const row = document.createElement("div");
		const name_el = document.createElement("div");
		const value_el = document.createElement("div");

		row.className = "result-field-row";
		name_el.className = "result-field-name";
		value_el.className = "result-field-value";
		name_el.textContent = key;
		if (Array.isArray(value)) {
			value_el.textContent = value.join(", ");
		} else if (value !== null && typeof value === "object") {
			value_el.textContent = JSON.stringify(value);
		} else {
			value_el.textContent = String(value);
		}
		row.appendChild(name_el);
		row.appendChild(value_el);
		card.appendChild(row);
	});
	return card;
}

function render_results(data) {
	const results_el = document.getElementById("results");
	const meta_el = document.getElementById("results-meta");
	const results = data && data.results ? data.results : {};
	const sources = Object.keys(results);
	let size;
	let took;
	let parts;

	clear_results();
	if (!data) {
		set_status("empty result", true);
		return;
	}
	size = typeof data.size === "number" ? data.size : null;
	took = typeof data.took === "number" ? data.took : null;
	parts = [];
	if (size !== null) {
		parts.push("results: " + size);
	}
	if (took !== null) {
		parts.push("time: " + took + " ms");
	}
	if (parts.length) {
		meta_el.textContent = parts.join(" | ");
		meta_el.classList.remove("hidden");
	}
	if (!sources.length) {
		const empty = document.createElement("div");

		empty.className = "result-empty";
		empty.textContent = "no results";
		results_el.appendChild(empty);
		return;
	}
	sources.forEach(function (source_name) {
		const entries = results[source_name];
		const group = render_group(source_name, entries);

		results_el.appendChild(group);
	});
}

function run_search() {
	const input = document.getElementById("search-input");
	const source_select = document.getElementById("source");
	const field_key = g_current_field;
	const config = g_field_config[field_key];
	let term;
	let api_key;
	let body;

	if (!field_key || !config) {
		return;
	}
	if (!config.types || !config.types.length) {
		set_status(
			"ip search not supported ",
			true
		);
		return;
	}
	term = input.value.trim();
	if (!term) {
		set_status("enter search value", true);
		return;
	}
	api_key = get_api_key();
	if (!api_key) {
		set_status("unable to find api key", true);
		return;
	}
	body = {
		terms: [term],
		types: config.types,
		source: source_select.value,
		wildcard: false,
		operator: "OR",
		page: 1,
		pagesize: 10000
	};
	clear_results();
	set_status("Finding...", false);
	fetch(g_api_url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: "Bearer " + api_key
		},
		body: JSON.stringify(body)
	})
		.then(function (res) {
			if (!res.ok) {
				set_status("Error API (" + res.status + ").", true);
				return null;
			}
			return res.json();
		})
		.then(function (data) {
			if (!data) {
				return;
			}
			render_results(data);
			close_input_panel();
			set_status("", false);
		})
		.catch(function () {
			set_status("network error for api call", true);
		});
}

function bind_events() {
	const buttons = document.querySelectorAll(".field-btn");
	const search_btn = document.getElementById("search-btn");
	const cancel_btn = document.getElementById("cancel-btn");
	const input = document.getElementById("search-input");

	buttons.forEach(function (btn) {
		btn.addEventListener("click", function () {
			const type = btn.dataset.type;

			if (type === "ip") {
				set_status(
					"not supported",
					true
				);
				return;
			}
			set_status("", false);
			open_input_panel(type);
		});
	});
	search_btn.addEventListener("click", function () {
		run_search();
	});
	cancel_btn.addEventListener("click", function () {
		close_input_panel();
		set_status("", false);
	});
	input.addEventListener("keydown", function (e) {
		if (e.key === "Enter") {
			run_search();
		} else if (e.key === "Escape") {
			close_input_panel();
			set_status("", false);
		}
	});
}

document.addEventListener("DOMContentLoaded", function () {
	bind_events();
});

