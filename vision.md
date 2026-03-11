# vision.id — SelahOS v1

## Product Name

SelahOS

---

# Purpose

SelahOS is a **minimal personal operating system for the organism**.

It is designed to maintain **physiological stability and ground contact**.

It does not manage ambitions, productivity, life goals, or projects.

It maintains the **ground layer of life**.

The system must remain **simple, calm, and stable**, capable of functioning for **decades with minimal change**.

SelahOS is intended to feel like:

- touching the ground
- checking a compass
- glancing at an instrument panel

It must never feel like:

- a productivity tool
- a coaching system
- a behavioral control system

---

# Core Philosophy

SelahOS manages the **ground layer of life**.

The ground layer consists of **daily anchors** that maintain the organism and ensure structural stability.

These anchors are non-negotiable in the sense that they **must always exist**, but they are quiet, practical, and non-ceremonial.

The system does **not instruct the user**.

The system does **not optimize the user**.

The system only provides **transparent visibility of the ground state**.

Authority remains with the user.

SelahOS acts as a **mirror of the ground**, not as a director.

---

# Ground Layer Anchors

SelahOS tracks the following anchors:

Sleep
Food
Medication
Hygiene
Movement
Ground contact

These anchors exist **every day**, including Shabbat.

They represent the **hardware layer of the organism**.

They are not productivity tasks. They are **stability loops**.

---

# Ground Contact

Ground contact consists of two types of interaction with life infrastructure:

Ground Maintenance
Ground Building

Ground Maintenance includes operational continuity work.

Examples:

- responding to operational system needs
- invoices and payments
- groceries
- household upkeep
- small system fixes

Ground Maintenance must exist **every day**, but it can be small.

Ground Building increases structural capacity.

Examples:

- improving infrastructure systems
- building automation pipelines
- system architecture work
- infrastructure design

Ground Building may be bounded but can be deeper work.

SelahOS **does not manage the content of these activities**, only their existence.

---

# Interaction Model

SelahOS interaction must remain extremely minimal.

Typical usage pattern:

Morning

- confirm sleep
- brief orientation

Day

- optional dashboard view

Evening (~22:00)

- medication
- hygiene
- mark anchors
- closing note

Weekly

- review signals

Daily interaction should take **less than one minute**.

Weekly interaction should take **less than two minutes**.

---

# Absolute Constraints

SelahOS must never include:

notifications
reminders
behavior nudging
streak systems
scores
gamification
AI coaching
productivity metrics

SelahOS must never **tell the user what to do**.

It only shows **the state of the ground**.

---

# Privacy Philosophy

SelahOS is **private-first**.

The ground layer is considered deeply personal.

The system is initially designed for **single-user usage**.

No social features exist.

No sharing features exist.

---

# Product Scope

SelahOS v1 is intentionally small.

The application must contain **three screens only**.

Additional screens are not permitted in v1.

---

# Screen 1 — Today (Dashboard)

This is the main screen.

It must display the entire daily ground state in **one screen with minimal scrolling**.

Structure:

Sleep
sleep_start
sleep_end

Food
breakfast
lunch
dinner

Medication
cipralex_taken

Body
hygiene_done
movement_done

Ground
ground_maintenance_done
ground_build_done

Current Ground Project
(project name)

Note
(one short daily note)

The screen must be usable **half-asleep**.

Interaction must be extremely simple.

Checkbox or circle completion UI is recommended.

---

# Screen 2 — Ground Project

Displays the currently active ground-building project.

Structure:

Current Ground Project
project_name

Status
active / paused

Start date

The active project changes rarely.

This prevents fragmentation of ground building effort.

---

# Screen 3 — Signals

Opened once per week.

Displays minimal signals about system stability.

Examples:

Financial signal (optional text)
Sleep stability
Weekly note

This screen must avoid dashboards or charts.

Signals are simple textual indicators.

---

# UX Principles

The interface must feel:

calm
stable
minimal
low-stimulation

Design should avoid:

bright colors
gamification
data overload
visual noise

The experience should resemble **a quiet instrument panel**.

---

# Technical Architecture

SelahOS v1 uses a **Supabase-backed architecture**.

The system must remain extremely lightweight and maintainable by a single developer.

---

# Stack

Frontend
Next.js (App Router)
React
Mobile-first UI
PWA enabled

Backend
Supabase

Services used:

Supabase Postgres
Supabase Auth
Row Level Security

Hosting

Vercel (selah.im/os)

---

# Database Schema

## Table: daily_records

Tracks the daily ground anchors.

Columns

id (uuid primary key)
user_id (uuid)
date (date)

sleep_start (timestamp)
sleep_end (timestamp)

breakfast (boolean)
lunch (boolean)
dinner (boolean)

cipralex_taken (boolean)

hygiene_done (boolean)
movement_done (boolean)

ground_maintenance_done (boolean)
ground_build_done (boolean)

note (text)

created_at (timestamp)

Unique constraint

user_id + date

---

## Table: ground_projects

Tracks the active ground building project.

Columns

id (uuid)
user_id (uuid)

name (text)
status (text)

start_date (date)

created_at (timestamp)

Normally only one active project exists.

---

## Table: weekly_signals

Tracks minimal weekly reflections.

Columns

id (uuid)
user_id (uuid)

week_start (date)

financial_note (text)
sleep_state (text)

note (text)

created_at (timestamp)

---

# Authentication

Use Supabase Auth.

Row Level Security rule:

user_id = auth.uid()

for all tables.

---

# API Interaction

Use Supabase client directly from frontend.

Operations required:

Daily Records

create or update today's record
fetch today's record
fetch recent records

Ground Projects

fetch active project
update project

Weekly Signals

create signal
fetch signals

---

# Performance Requirements

SelahOS must load extremely quickly.

Daily interaction must require **less than 5 seconds**.

The interface must be responsive on mobile.

---

# Longevity Requirement

SelahOS must be designed so that the core structure can remain **stable for decades**.

Avoid feature creep.

Avoid complex analytics.

Avoid schema designs that require frequent migrations.

The system should remain **durable, minimal, and quiet**.

---

# Development Deliverables

The system builder should produce:

Product architecture
UI layout design
Database schema implementation
Supabase configuration
Minimal frontend implementation

The goal is a **stable v1**, not a feature-rich application.

Simplicity and durability are the primary design values.
