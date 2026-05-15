--
-- PostgreSQL database cluster dump
--

\restrict NlVVVbH9Tt9on7J6qrwi8GKh50OrWdfYPSexcSy0dwJIlZWKMeObHRqbOKLYRdc

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Drop databases (except postgres and template1)
--

DROP DATABASE mydatabase;




--
-- Drop roles
--

DROP ROLE myuser;


--
-- Roles
--

CREATE ROLE myuser;
ALTER ROLE myuser WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:x3G2PtTc960kjALH1L8d8w==$oRo2fK3TZQt1ummQ/o3YkjBssv7vBLma5mUl67rY6qY=:cZe/9zSpD9ILIlO8Nu5K33xaBGvWw+5BPxI1m2HCiOM=';

--
-- User Configurations
--








\unrestrict NlVVVbH9Tt9on7J6qrwi8GKh50OrWdfYPSexcSy0dwJIlZWKMeObHRqbOKLYRdc

--
-- Databases
--

--
-- Database "template1" dump
--

--
-- PostgreSQL database dump
--

\restrict dFnT2sLB3mXrBpa6egDMX9lI3rZLlhS6pH4f6V2R17h6ocGmdNir9eSRNtNg6Q4

-- Dumped from database version 15.17 (Debian 15.17-1.pgdg13+1)
-- Dumped by pg_dump version 15.17 (Debian 15.17-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

UPDATE pg_catalog.pg_database SET datistemplate = false WHERE datname = 'template1';
DROP DATABASE template1;
--
-- Name: template1; Type: DATABASE; Schema: -; Owner: myuser
--

CREATE DATABASE template1 WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE template1 OWNER TO myuser;

\unrestrict dFnT2sLB3mXrBpa6egDMX9lI3rZLlhS6pH4f6V2R17h6ocGmdNir9eSRNtNg6Q4
\connect template1
\restrict dFnT2sLB3mXrBpa6egDMX9lI3rZLlhS6pH4f6V2R17h6ocGmdNir9eSRNtNg6Q4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: DATABASE template1; Type: COMMENT; Schema: -; Owner: myuser
--

COMMENT ON DATABASE template1 IS 'default template for new databases';


--
-- Name: template1; Type: DATABASE PROPERTIES; Schema: -; Owner: myuser
--

ALTER DATABASE template1 IS_TEMPLATE = true;


\unrestrict dFnT2sLB3mXrBpa6egDMX9lI3rZLlhS6pH4f6V2R17h6ocGmdNir9eSRNtNg6Q4
\connect template1
\restrict dFnT2sLB3mXrBpa6egDMX9lI3rZLlhS6pH4f6V2R17h6ocGmdNir9eSRNtNg6Q4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: DATABASE template1; Type: ACL; Schema: -; Owner: myuser
--

REVOKE CONNECT,TEMPORARY ON DATABASE template1 FROM PUBLIC;
GRANT CONNECT ON DATABASE template1 TO PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict dFnT2sLB3mXrBpa6egDMX9lI3rZLlhS6pH4f6V2R17h6ocGmdNir9eSRNtNg6Q4

--
-- Database "mydatabase" dump
--

--
-- PostgreSQL database dump
--

\restrict YrPnvdm6xyRidtstqXaGA7VnKIqYQ5yS8YF5av7PFcFqwGDXPbFjmg5omzfRFk3

-- Dumped from database version 15.17 (Debian 15.17-1.pgdg13+1)
-- Dumped by pg_dump version 15.17 (Debian 15.17-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: mydatabase; Type: DATABASE; Schema: -; Owner: myuser
--

CREATE DATABASE mydatabase WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE mydatabase OWNER TO myuser;

\unrestrict YrPnvdm6xyRidtstqXaGA7VnKIqYQ5yS8YF5av7PFcFqwGDXPbFjmg5omzfRFk3
\connect mydatabase
\restrict YrPnvdm6xyRidtstqXaGA7VnKIqYQ5yS8YF5av7PFcFqwGDXPbFjmg5omzfRFk3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: User; Type: TABLE; Schema: public; Owner: myuser
--

CREATE TABLE public."User" (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    "emailVerified" boolean DEFAULT false NOT NULL,
    role text DEFAULT 'user'::text NOT NULL,
    "verificationToken" text,
    "refreshToken" text,
    "resetPasswordToken" text,
    "resetPasswordExpire" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO myuser;

--
-- Name: User_id_seq; Type: SEQUENCE; Schema: public; Owner: myuser
--

CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."User_id_seq" OWNER TO myuser;

--
-- Name: User_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: myuser
--

ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: myuser
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO myuser;

--
-- Name: User id; Type: DEFAULT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: myuser
--

COPY public."User" (id, name, email, password, "emailVerified", role, "verificationToken", "refreshToken", "resetPasswordToken", "resetPasswordExpire", "createdAt", "updatedAt") FROM stdin;
1	adnan hassan	ah5404219@gmail.com	$2b$10$79dHkrNoMEhcDGtUMV3xkOjvixQ5gA7ai3utPlbgis8R5oWZMwtj2	f	user	6f2c647e84a73527d56c0c921d8327ed0121a0644d3d3148039b837390c71a31	\N	\N	\N	2026-05-12 11:04:05.724	2026-05-12 11:04:05.724
2	adnan hassan	ah54074219@gmail.com	$2b$10$VGazHxk.f./k8n7o.v.lv.uttMU5nWZ96mpyyjjo18FgHlhXxKuMm	f	user	e5d73598d65b401cd543c6590e8b91e248cdee7748ba1b10d0a2ae2a4d221be1	\N	\N	\N	2026-05-12 11:14:56.289	2026-05-12 11:14:56.289
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: myuser
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
8c4f202d-9c3c-4f5f-ab4c-4e5c3f7ac845	b7b8ad46870fd21abaf8118cbfb15287cd717ca811d1d6a2a17d12ba3a862aad	2026-05-12 11:03:10.130399+00	20260512104042_init	\N	\N	2026-05-12 11:03:10.105331+00	1
\.


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: myuser
--

SELECT pg_catalog.setval('public."User_id_seq"', 2, true);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: myuser
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: myuser
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- PostgreSQL database dump complete
--

\unrestrict YrPnvdm6xyRidtstqXaGA7VnKIqYQ5yS8YF5av7PFcFqwGDXPbFjmg5omzfRFk3

--
-- Database "postgres" dump
--

--
-- PostgreSQL database dump
--

\restrict VEa1an4AzICYNX9cQACFtdxsn5tNvMs7olqOawuX14XLCNSXyJW05jBIPJtn795

-- Dumped from database version 15.17 (Debian 15.17-1.pgdg13+1)
-- Dumped by pg_dump version 15.17 (Debian 15.17-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE postgres;
--
-- Name: postgres; Type: DATABASE; Schema: -; Owner: myuser
--

CREATE DATABASE postgres WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE postgres OWNER TO myuser;

\unrestrict VEa1an4AzICYNX9cQACFtdxsn5tNvMs7olqOawuX14XLCNSXyJW05jBIPJtn795
\connect postgres
\restrict VEa1an4AzICYNX9cQACFtdxsn5tNvMs7olqOawuX14XLCNSXyJW05jBIPJtn795

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: DATABASE postgres; Type: COMMENT; Schema: -; Owner: myuser
--

COMMENT ON DATABASE postgres IS 'default administrative connection database';


--
-- PostgreSQL database dump complete
--

\unrestrict VEa1an4AzICYNX9cQACFtdxsn5tNvMs7olqOawuX14XLCNSXyJW05jBIPJtn795

--
-- PostgreSQL database cluster dump complete
--

