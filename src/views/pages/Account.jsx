
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    UserRound,
    Mail,
    Phone,
    ShieldCheck,
    CalendarDays,
    Fingerprint,
    Pencil,
    Save,
    X,
    LogOut
} from "lucide-react";
import "../../style/style.css";
import Navbar from "../components/Navbar";
const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

function Account() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [form, setForm] = useState({
        full_name: "",
        email: "",
        phone: ""
    });

    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function loadAccount() {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await fetch(`${API_URL}/api/account`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                localStorage.removeItem("userId");
                navigate("/login");
                return;
            }

            if (!response.ok) {
                throw new Error(
                    data.message || "Could not load account details."
                );
            }

            setUser(data.user);
            setForm({
                full_name: data.user.full_name || "",
                email: data.user.email || "",
                phone: data.user.phone || ""
            });

            localStorage.setItem("user", JSON.stringify(data.user));
        } catch (err) {
            setError(err.message || "Unable to connect to the server.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadAccount();
    }, []);

    function handleChange(event) {
        const { name, value } = event.target;

        setForm(previous => ({
            ...previous,
            [name]: value
        }));
    }

    async function handleSave(event) {
        event.preventDefault();

        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const response = await fetch(`${API_URL}/api/account`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(form)
            });

            const data = await response.json();

            if (response.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                localStorage.removeItem("userId");
                navigate("/login");
                return;
            }

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to update account."
                );
            }

            setUser(data.user);
            setForm({
                full_name: data.user.full_name || "",
                email: data.user.email || "",
                phone: data.user.phone || ""
            });

            localStorage.setItem("user", JSON.stringify(data.user));

            setEditing(false);
            setSuccess("Your account details have been updated.");
        } catch (err) {
            setError(err.message || "Unable to save changes.");
        } finally {
            setSaving(false);
        }
    }

    function cancelEditing() {
        setForm({
            full_name: user.full_name || "",
            email: user.email || "",
            phone: user.phone || ""
        });

        setEditing(false);
        setError("");
        setSuccess("");
    }

    function handleLogout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("userId");
        localStorage.removeItem("touristId");
        navigate("/login");
    }

    if (loading) {
        return (
            <div className="account-state">
                <div className="account-loader" />
                <p>Loading your account...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="account-state">
                <p>{error || "Account details are unavailable."}</p>
                <button onClick={loadAccount}>Try again</button>
            </div>
        );
    }

    const initials = (user.full_name || "U")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part[0])
        .join("")
        .toUpperCase();

    return (
        <main className="account-page">
            <Navbar />
            <div className="account-container">
                <header className="account-heading">
                    <div>
                        <span className="account-eyebrow">
                            TOURSAFE PROFILE
                        </span>
                        <h1>My Account</h1>
                        <p>Manage your personal information and account details.</p>
                    </div>

                    <button
                        type="button"
                        className="account-logout"
                        onClick={handleLogout}
                    >
                        <LogOut size={17} />
                        <span>Log out</span>
                    </button>
                </header>

                <section className="account-profile-card">
                    <div className="account-avatar">{initials}</div>

                    <div className="account-profile-info">
                        <h2>{user.full_name}</h2>
                        <p>{user.email}</p>
                        <span className="account-status">
                            <ShieldCheck size={15} />
                            Registered Tourist
                        </span>
                    </div>

                    <div className="account-tourist-id">
                        <span>TOURIST ID</span>
                        <strong>{user.tourist_id || "Not assigned"}</strong>
                    </div>
                </section>

                {error && (
                    <div className="account-message account-error">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="account-message account-success">
                        {success}
                    </div>
                )}

                <section className="account-details-card">
                    <div className="account-section-heading">
                        <div>
                            <h2>Personal Information</h2>
                            <p>Keep your account details up to date.</p>
                        </div>

                        {!editing && (
                            <button
                                type="button"
                                className="account-edit-button"
                                onClick={() => {
                                    setEditing(true);
                                    setError("");
                                    setSuccess("");
                                }}
                            >
                                <Pencil size={16} />
                                Edit profile
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSave}>
                        <div className="account-fields">
                            <label className="account-field">
                                <span>Full Name</span>
                                <div className="account-input-wrap">
                                    <UserRound size={18} />
                                    <input
                                        name="full_name"
                                        value={form.full_name}
                                        onChange={handleChange}
                                        disabled={!editing}
                                        maxLength={100}
                                        required
                                        autoComplete="name"
                                    />
                                </div>
                            </label>

                            <label className="account-field">
                                <span>Email Address</span>
                                <div className="account-input-wrap">
                                    <Mail size={18} />
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        // onChange={handleChange}
                                        disabled={!editing}
                                        maxLength={150}
                                        required
                                        autoComplete="email"
                                        readOnly
                                    />
                                </div>
                            </label>

                            <label className="account-field">
                                <span>Phone Number</span>
                                <div className="account-input-wrap">
                                    <Phone size={18} />
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleChange}
                                        disabled={!editing}
                                        maxLength={20}
                                        autoComplete="tel"
                                        placeholder="Enter phone number"
                                    />
                                </div>
                            </label>

                            <div className="account-field">
                                <span>Tourist ID</span>
                                <div className="account-input-wrap account-readonly">
                                    <Fingerprint size={18} />
                                    <input
                                        value={user.tourist_id || "Not assigned"}
                                        disabled
                                        readOnly
                                    />
                                </div>
                            </div>

                            <div className="account-field">
                                <span>Registration Date</span>
                                <div className="account-input-wrap account-readonly">
                                    <CalendarDays size={18} />
                                    <input
                                        value={
                                            user.created_at
                                                ? new Date(
                                                    user.created_at
                                                ).toLocaleDateString("en-IN", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric"
                                                })
                                                : "Not available"
                                        }
                                        disabled
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>

                        {editing && (
                            <div className="account-form-actions">
                                <button
                                    type="button"
                                    className="account-cancel-button"
                                    onClick={cancelEditing}
                                    disabled={saving}
                                >
                                    <X size={17} />
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="account-save-button"
                                    disabled={saving}
                                >
                                    <Save size={17} />
                                    {saving ? "Saving..." : "Save changes"}
                                </button>
                            </div>
                        )}
                    </form>
                </section>

                <p className="account-security-note">
                    <ShieldCheck size={17} />
                    Your account information is retrieved from the TourSafe
                    database. Your password is never displayed on this page.
                </p>
            </div>
        </main>
    );
}

export default Account;
