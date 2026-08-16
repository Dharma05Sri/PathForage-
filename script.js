/* ==========================================================================
   PATHFORAGE — script.js
   ==========================================================================
   PART 1
   --------------------------------------------------------------------------
   PURPOSE
   --------------------------------------------------------------------------
   Core JavaScript foundation for the PathForage Opportunity Operating System.

   This file is intentionally modular in architecture even though the first
   implementation is being delivered as one continuous script.js file.

   Core responsibilities established in this part:

   - Global PathForage namespace
   - Application configuration
   - DOM utilities
   - Safe feature detection
   - Event bus
   - Analytics bridge
   - Storage abstraction
   - Application state foundation
   - Opportunity data foundation
   - Runtime diagnostics
   - Accessibility helpers
   - Reduced-motion / Save-Data detection
   - Application lifecycle

   IMPORTANT
   --------------------------------------------------------------------------
   This is a standalone .js file.

   DO NOT add:
   - <script>
   - </script>
   - HTML
   - CSS
   - closing document tags

   PART 2 MUST CONTINUE DIRECTLY BELOW THIS LINE.
   ========================================================================== */


/* ==========================================================================
   1 — STRICT MODE
   ========================================================================== */

"use strict";


/* ==========================================================================
   2 — PATHFORAGE ROOT NAMESPACE
   ========================================================================== */

(function (window, document) {

    /*
     * Keep every global feature under one namespace.
     *
     * PathForage should avoid polluting the browser's global namespace with
     * dozens of unrelated variables.
     */

    const PathForage =
        window.PathForage ||
        {};

    window.PathForage =
        PathForage;


    /*
     * Version information.
     *
     * This is intentionally application-level information rather than a
     * dependency version.
     */

    PathForage.version =
        PathForage.version ||
        "1.0.0";


    PathForage.build =
        PathForage.build ||
        "foundation";


    PathForage.initialized =
        Boolean(
            PathForage.initialized
        );


/* ==========================================================================
   3 — APPLICATION CONFIGURATION
   ========================================================================== */

    PathForage.config =
        PathForage.config ||
        {

            /*
             * Product identity.
             */

            name:
                "PathForage",

            shortName:
                "PF",

            environment:
                "production",


            /*
             * Storage namespace.
             */

            storagePrefix:
                "pathforage_",


            /*
             * Local state version.
             *
             * Increment this when the structure of persisted state changes
             * in a way that requires migration.
             */

            stateVersion:
                1,


            /*
             * Search configuration.
             */

            search:

                {

                    minimumQueryLength:
                        1,

                    debounceMilliseconds:
                        180,

                    defaultSort:
                        "recommended"

                },


            /*
             * UI configuration.
             */

            ui:

                {

                    toastDuration:
                        3000,

                    animationThreshold:
                        0.12,

                    scrollOffset:
                        12

                },


            /*
             * Analytics configuration.
             *
             * The actual Google Analytics loader remains in index.html.
             * This JavaScript layer only communicates with gtag() when it
             * exists.
             */

            analytics:

                {

                    enabled:
                        true,

                    measurementId:
                        "G-5HVBHX1KDW",

                    provider:
                        "google-analytics",

                    debug:
                        false

                },


            /*
             * Advertising configuration.
             *
             * AdSense loading belongs to index.html.
             *
             * JavaScript will later provide ad-slot behavior without
             * injecting the publisher loader repeatedly.
             */

            ads:

                {

                    enabled:
                        true,

                    provider:
                        "google-adsense",

                    publisherId:
                        "ca-pub-1495090071076386"

                },


            /*
             * Performance flags.
             */

            performance:

                {

                    reducedMotion:
                        false,

                    saveData:
                        false

                }

        };


/* ==========================================================================
   4 — GLOBAL CONSTANTS
   ========================================================================== */

    const CONSTANTS =
        {

            EVENTS:

                {

                    READY:
                        "pathforage:ready",

                    STATE_CHANGED:
                        "pathforage:state-changed",

                    OPPORTUNITY_SEARCH:
                        "pathforage:opportunity-search",

                    OPPORTUNITY_SAVED:
                        "pathforage:opportunity-saved",

                    OPPORTUNITY_ADDED:
                        "pathforage:opportunity-added",

                    PROFILE_UPDATED:
                        "pathforage:profile-updated",

                    BLUEPRINT_RESET:
                        "pathforage:blueprint-reset"

                },


            SELECTORS:

                {

                    progressiveContent:
                        ".pf-progressive-content",

                    toastRegion:
                        "#pf-toast-region",

                    announcer:
                        "#pf-screen-reader-announcer",

                    opportunitySearch:
                        "#pf-opportunity-search",

                    opportunityResults:
                        "#pf-opportunity-results",

                    opportunityCards:
                        ".pf-opportunity-mini-card",

                    filterChips:
                        ".pf-filter-chip",

                    blueprint:
                        "#blueprint-builder",

                    profileModal:
                        "#pf-profile-modal",

                    profileForm:
                        "#pf-profile-form"

                },


            STORAGE:

                {

                    blueprint:
                        "blueprint_v1",

                    preferences:
                        "preferences_v1",

                    profile:
                        "profile_v1"

                }

        };


    PathForage.constants =
        CONSTANTS;


/* ==========================================================================
   5 — RUNTIME ENVIRONMENT
   ========================================================================== */

    const Runtime =
        {

            isBrowser:
                typeof window !== "undefined" &&
                typeof document !== "undefined",

            isOnline:
                typeof navigator !== "undefined"
                    ? navigator.onLine !== false
                    : true,

            reducedMotion:
                false,

            saveData:
                false,

            initializedAt:
                null

        };


    PathForage.runtime =
        Runtime;


/* ==========================================================================
   6 — SAFE OBJECT UTILITIES
   ========================================================================== */

    function isObject(value) {

        return (
            value !== null &&
            typeof value === "object" &&
            !Array.isArray(value)
        );

    }


    function isFunction(value) {

        return (
            typeof value === "function"
        );

    }


    function isString(value) {

        return (
            typeof value === "string"
        );

    }


    function normalizeString(value) {

        return String(
            value === null ||
            value === undefined
                ? ""
                : value
        )
            .trim()
            .toLowerCase();

    }


    function cloneObject(value) {

        if (!isObject(value)) {

            return value;

        }


        try {

            return JSON.parse(
                JSON.stringify(value)
            );

        } catch (error) {

            return {};

        }

    }


    function mergeObjects(
        base,
        override
    ) {

        const result =
            isObject(base)
                ? Object.assign(
                    {},
                    base
                )
                : {};


        if (!isObject(override)) {

            return result;

        }


        Object.keys(
            override
        ).forEach(
            function (key) {

                const value =
                    override[key];


                if (
                    isObject(value) &&
                    isObject(result[key])
                ) {

                    result[key] =
                        mergeObjects(
                            result[key],
                            value
                        );

                } else {

                    result[key] =
                        value;

                }

            }
        );


        return result;

    }


    PathForage.utils =
        PathForage.utils ||
        {};


    PathForage.utils.isObject =
        isObject;


    PathForage.utils.isFunction =
        isFunction;


    PathForage.utils.isString =
        isString;


    PathForage.utils.normalizeString =
        normalizeString;


    PathForage.utils.clone =
        cloneObject;


    PathForage.utils.merge =
        mergeObjects;


/* ==========================================================================
   7 — DOM UTILITIES
   ========================================================================== */

    const DOM =
        {

            get:
                function (selector, root) {

                    const context =
                        root || document;

                    if (
                        !context ||
                        !selector
                    ) {

                        return null;

                    }


                    return context.querySelector(
                        selector
                    );

                },


            getAll:
                function (selector, root) {

                    const context =
                        root || document;

                    if (
                        !context ||
                        !selector
                    ) {

                        return [];

                    }


                    return Array.from(
                        context.querySelectorAll(
                            selector
                        )
                    );

                },


            byId:
                function (id) {

                    if (!id) {

                        return null;

                    }


                    return document.getElementById(
                        id
                    );

                },


            exists:
                function (selector, root) {

                    return Boolean(
                        DOM.get(
                            selector,
                            root
                        )
                    );

                },


            show:
                function (element) {

                    if (!element) {

                        return;

                    }


                    element.hidden =
                        false;

                },


            hide:
                function (element) {

                    if (!element) {

                        return;

                    }


                    element.hidden =
                        true;

                },


            toggle:
                function (
                    element,
                    visible
                ) {

                    if (!element) {

                        return;

                    }


                    element.hidden =
                        !Boolean(
                            visible
                        );

                },


            addClass:
                function (
                    element,
                    className
                ) {

                    if (
                        !element ||
                        !className
                    ) {

                        return;

                    }


                    element.classList.add(
                        className
                    );

                },


            removeClass:
                function (
                    element,
                    className
                ) {

                    if (
                        !element ||
                        !className
                    ) {

                        return;

                    }


                    element.classList.remove(
                        className
                    );

                },


            toggleClass:
                function (
                    element,
                    className,
                    force
                ) {

                    if (
                        !element ||
                        !className
                    ) {

                        return false;

                    }


                    return element.classList.toggle(
                        className,
                        force
                    );

                }

        };


    PathForage.dom =
        DOM;


/* ==========================================================================
   8 — EVENT BUS
   ========================================================================== */

    const EventBus =
        {

            listeners:
                new Map(),


            on:
                function (
                    eventName,
                    callback
                ) {

                    if (
                        !eventName ||
                        !isFunction(callback)
                    ) {

                        return function () {};

                    }


                    if (
                        !this.listeners.has(
                            eventName
                        )
                    ) {

                        this.listeners.set(
                            eventName,
                            new Set()
                        );

                    }


                    const callbacks =
                        this.listeners.get(
                            eventName
                        );


                    callbacks.add(
                        callback
                    );


                    return function () {

                        callbacks.delete(
                            callback
                        );

                    };

                },


            once:
                function (
                    eventName,
                    callback
                ) {

                    if (
                        !eventName ||
                        !isFunction(callback)
                    ) {

                        return function () {};

                    }


                    const self =
                        this;


                    function onceHandler(
                        payload
                    ) {

                        self.off(
                            eventName,
                            onceHandler
                        );


                        callback(
                            payload
                        );

                    }


                    return this.on(
                        eventName,
                        onceHandler
                    );

                },


            off:
                function (
                    eventName,
                    callback
                ) {

                    if (
                        !eventName
                    ) {

                        return;

                    }


                    const callbacks =
                        this.listeners.get(
                            eventName
                        );


                    if (!callbacks) {

                        return;

                    }


                    if (
                        callback
                    ) {

                        callbacks.delete(
                            callback
                        );

                    } else {

                        callbacks.clear();

                    }


                    if (
                        callbacks.size === 0
                    ) {

                        this.listeners.delete(
                            eventName
                        );

                    }

                },


            emit:
                function (
                    eventName,
                    payload
                ) {

                    if (
                        !eventName
                    ) {

                        return;

                    }


                    const callbacks =
                        this.listeners.get(
                            eventName
                        );


                    if (!callbacks) {

                        return;

                    }


                    callbacks.forEach(
                        function (callback) {

                            try {

                                callback(
                                    payload
                                );

                            } catch (error) {

                                PathForage.debug.error(
                                    "Event listener failed.",
                                    error
                                );

                            }

                        }
                    );

                }

        };


    PathForage.events =
        EventBus;


/* ==========================================================================
   9 — DEBUG / DIAGNOSTICS
   ========================================================================== */

    const Debug =
        {

            enabled:
                false,


            log:
                function () {

                    if (!this.enabled) {

                        return;

                    }


                    if (
                        typeof console !==
                        "undefined" &&
                        isFunction(
                            console.log
                        )
                    ) {

                        console.log.apply(
                            console,
                            [
                                "[PathForage]"
                            ].concat(
                                Array.from(
                                    arguments
                                )
                            )
                        );

                    }

                },


            warn:
                function () {

                    if (
                        typeof console ===
                        "undefined" ||
                        !isFunction(
                            console.warn
                        )
                    ) {

                        return;

                    }


                    console.warn.apply(
                        console,
                        [
                            "[PathForage]"
                        ].concat(
                            Array.from(
                                arguments
                            )
                        )
                    );

                },


            error:
                function () {

                    if (
                        typeof console ===
                        "undefined" ||
                        !isFunction(
                            console.error
                        )
                    ) {

                        return;

                    }


                    console.error.apply(
                        console,
                        [
                            "[PathForage]"
                        ].concat(
                            Array.from(
                                arguments
                            )
                        )
                    );

                }

        };


    PathForage.debug =
        Debug;


/* ==========================================================================
   10 — ANALYTICS BRIDGE
   ========================================================================== */

    /*
     * Google Analytics is loaded by index.html.
     *
     * Measurement ID:
     * G-5HVBHX1KDW
     *
     * This file MUST NOT inject another gtag.js loader.
     *
     * The bridge below safely uses the existing global gtag() function.
     */


    const Analytics =
        {

            enabled:
                Boolean(
                    PathForage.config.analytics.enabled
                ),


            measurementId:
                PathForage.config.analytics
                    .measurementId,


            isAvailable:
                function () {

                    return (
                        typeof window.gtag ===
                        "function"
                    );

                },


            track:
                function (
                    eventName,
                    parameters
                ) {

                    if (
                        !this.enabled ||
                        !eventName
                    ) {

                        return false;

                    }


                    if (
                        !this.isAvailable()
                    ) {

                        /*
                         * Analytics must never prevent the application
                         * from functioning.
                         */

                        return false;

                    }


                    try {

                        window.gtag(
                            "event",
                            eventName,
                            parameters ||
                            {}
                        );


                        return true;

                    } catch (error) {

                        Debug.warn(
                            "Analytics event failed.",
                            error
                        );


                        return false;

                    }

                },


            pageView:
                function (
                    pagePath
                ) {

                    if (
                        !this.isAvailable()
                    ) {

                        return false;

                    }


                    try {

                        window.gtag(
                            "config",
                            this.measurementId,
                            {

                                page_path:
                                    pagePath ||
                                    window.location.pathname

                            }
                        );


                        return true;

                    } catch (error) {

                        Debug.warn(
                            "Analytics page view failed.",
                            error
                        );


                        return false;

                    }

                }

        };


    PathForage.analytics =
        Analytics;


/* ==========================================================================
   11 — SEMANTIC ANALYTICS EVENT NAMES
   ========================================================================== */

    PathForage.analytics.events =
        {

            profileStarted:
                "profile_started",

            profileCompleted:
                "profile_completed",

            opportunitySearch:
                "opportunity_search",

            opportunityViewed:
                "opportunity_viewed",

            opportunitySaved:
                "opportunity_saved",

            opportunityAdded:
                "opportunity_added_to_blueprint",

            blueprintExported:
                "blueprint_exported",

            gapAnalysisStarted:
                "gap_analysis_started",

            portfolioForgeOpened:
                "portfolio_forge_opened",

            communityOpened:
                "community_opened",

            pricingViewed:
                "pricing_viewed",

            ctaClicked:
                "primary_cta_clicked"

        };


/* ==========================================================================
   12 — STORAGE ABSTRACTION
   ========================================================================== */

    const Storage =
        {

            available:
                function () {

                    try {

                        const testKey =
                            "__pf_storage_test__";


                        window.localStorage.setItem(
                            testKey,
                            "1"
                        );


                        window.localStorage.removeItem(
                            testKey
                        );


                        return true;

                    } catch (error) {

                        return false;

                    }

                },


            makeKey:
                function (
                    key
                ) {

                    return (
                        PathForage.config.storagePrefix +
                        String(key || "")
                    );

                },


            get:
                function (
                    key,
                    fallback
                ) {

                    if (
                        !this.available() ||
                        !key
                    ) {

                        return (
                            fallback === undefined
                                ? null
                                : fallback
                        );

                    }


                    try {

                        const raw =
                            window.localStorage.getItem(
                                this.makeKey(
                                    key
                                )
                            );


                        if (
                            raw === null
                        ) {

                            return (
                                fallback === undefined
                                    ? null
                                    : fallback
                            );

                        }


                        return JSON.parse(
                            raw
                        );

                    } catch (error) {

                        Debug.warn(
                            "Storage read failed.",
                            error
                        );


                        return (
                            fallback === undefined
                                ? null
                                : fallback
                        );

                    }

                },


            set:
                function (
                    key,
                    value
                ) {

                    if (
                        !this.available() ||
                        !key
                    ) {

                        return false;

                    }


                    try {

                        window.localStorage.setItem(
                            this.makeKey(
                                key
                            ),
                            JSON.stringify(
                                value
                            )
                        );


                        return true;

                    } catch (error) {

                        Debug.warn(
                            "Storage write failed.",
                            error
                        );


                        return false;

                    }

                },


            remove:
                function (
                    key
                ) {

                    if (
                        !this.available() ||
                        !key
                    ) {

                        return false;

                    }


                    try {

                        window.localStorage.removeItem(
                            this.makeKey(
                                key
                            )
                        );


                        return true;

                    } catch (error) {

                        Debug.warn(
                            "Storage removal failed.",
                            error
                        );


                        return false;

                    }

                },


            clearNamespace:
                function () {

                    if (
                        !this.available()
                    ) {

                        return false;

                    }


                    const prefix =
                        PathForage.config.storagePrefix;


                    try {

                        const keys = [];


                        for (
                            let index = 0;
                            index <
                            window.localStorage.length;
                            index++
                        ) {

                            const key =
                                window.localStorage.key(
                                    index
                                );


                            if (
                                key &&
                                key.indexOf(
                                    prefix
                                ) === 0
                            ) {

                                keys.push(
                                    key
                                );

                            }

                        }


                        keys.forEach(
                            function (key) {

                                window.localStorage.removeItem(
                                    key
                                );

                            }
                        );


                        return true;

                    } catch (error) {

                        Debug.warn(
                            "Storage namespace cleanup failed.",
                            error
                        );


                        return false;

                    }

                }

        };


    PathForage.storage =
        Storage;


/* ==========================================================================
   13 — DEFAULT PROFILE STATE
   ========================================================================== */

    const DEFAULT_PROFILE =
        {

            academicDirection:
                "computer-science",

            country:
                "global",

            score:
                null,

            budget:
                "low",

            interests:
                []

        };


/* ==========================================================================
   14 — DEFAULT BLUEPRINT STATE
   ========================================================================== */

    const DEFAULT_BLUEPRINT_STATE =
        {

            version:
                PathForage.config.stateVersion,


            profile:
                cloneObject(
                    DEFAULT_PROFILE
                ),


            savedOpportunities:
                [],


            milestones:

                [

                    {

                        id:
                            "profile",

                        status:
                            "complete"

                    },


                    {

                        id:
                            "discovery",

                        status:
                            "active"

                    },


                    {

                        id:
                            "preparation",

                        status:
                            "planned"

                    },


                    {

                        id:
                            "applications",

                        status:
                            "upcoming"

                    }

                ]

        };


/* ==========================================================================
   15 — LOCAL OPPORTUNITY DATA READER
   ========================================================================== */

    function readEmbeddedJSON(
        elementId,
        fallback
    ) {

        const element =
            DOM.byId(
                elementId
            );


        if (!element) {

            return cloneObject(
                fallback
            );

        }


        try {

            const parsed =
                JSON.parse(
                    element.textContent
                );


            return parsed;

        } catch (error) {

            Debug.warn(
                "Embedded JSON could not be parsed:",
                elementId
            );


            return cloneObject(
                fallback
            );

        }

    }


    function getOpportunityData() {

        const embedded =
            readEmbeddedJSON(
                "pf-local-opportunity-data",
                {

                    version:
                        "1.0",

                    sourceType:
                        "local-demo",

                    opportunities:
                        []

                }
            );


        if (
            !Array.isArray(
                embedded.opportunities
            )
        ) {

            embedded.opportunities =
                [];

        }


        return embedded;

    }


    PathForage.data =
        PathForage.data ||
        {};


    PathForage.data.opportunities =
        getOpportunityData();


/* ==========================================================================
   16 — APPLICATION STATE FOUNDATION
   ========================================================================== */

    const State =
        {

            data:
                null,


            subscribers:
                new Set(),


            initialize:
                function () {

                    const stored =
                        Storage.get(
                            CONSTANTS.STORAGE
                                .blueprint,
                            null
                        );


                    const embedded =
                        readEmbeddedJSON(
                            "pf-default-blueprint-state",
                            DEFAULT_BLUEPRINT_STATE
                        );


                    const base =
                        mergeObjects(
                            DEFAULT_BLUEPRINT_STATE,
                            embedded
                        );


                    this.data =
                        stored
                            ? mergeObjects(
                                base,
                                stored
                            )
                            : base;


                    if (
                        !Array.isArray(
                            this.data.savedOpportunities
                        )
                    ) {

                        this.data.savedOpportunities =
                            [];

                    }


                    if (
                        !Array.isArray(
                            this.data.milestones
                        )
                    ) {

                        this.data.milestones =
                            cloneObject(
                                DEFAULT_BLUEPRINT_STATE
                                    .milestones
                            );

                    }


                    if (
                        !isObject(
                            this.data.profile
                        )
                    ) {

                        this.data.profile =
                            cloneObject(
                                DEFAULT_PROFILE
                            );

                    }


                    return this.data;

                },


            get:
                function () {

                    if (
                        !this.data
                    ) {

                        this.initialize();

                    }


                    return this.data;

                },


            save:
                function () {

                    if (
                        !this.data
                    ) {

                        return false;

                    }


                    const saved =
                        Storage.set(
                            CONSTANTS.STORAGE
                                .blueprint,
                            this.data
                        );


                    return saved;

                },


            notify:
                function (
                    reason,
                    payload
                ) {

                    const state =
                        this.get();


                    this.subscribers.forEach(
                        function (
                            subscriber
                        ) {

                            try {

                                subscriber(
                                    state,
                                    reason,
                                    payload
                                );

                            } catch (error) {

                                Debug.error(
                                    "State subscriber failed.",
                                    error
                                );

                            }

                        }
                    );


                    EventBus.emit(
                        CONSTANTS.EVENTS
                            .STATE_CHANGED,
                        {

                            state:
                                state,

                            reason:
                                reason,

                            payload:
                                payload

                        }
                    );

                },


            subscribe:
                function (
                    callback
                ) {

                    if (
                        !isFunction(
                            callback
                        )
                    ) {

                        return function () {};

                    }


                    this.subscribers.add(
                        callback
                    );


                    return function () {

                        this.subscribers.delete(
                            callback
                        );

                    };

                }

        };


    PathForage.state =
        State;


/* ==========================================================================
   17 — PROFILE STATE OPERATIONS
   ========================================================================== */

    State.updateProfile =
        function (
            profile
        ) {

            const state =
                this.get();


            state.profile =
                mergeObjects(
                    state.profile ||
                    DEFAULT_PROFILE,
                    profile ||
                    {}
                );


            this.save();


            this.notify(
                "profile-updated",
                {

                    profile:
                        state.profile

                }
            );


            EventBus.emit(
                CONSTANTS.EVENTS
                    .PROFILE_UPDATED,
                state.profile
            );


            return state.profile;

        };


/* ==========================================================================
   18 — OPPORTUNITY STATE OPERATIONS
   ========================================================================== */

    State.addOpportunity =
        function (
            opportunityId
        ) {

            if (!opportunityId) {

                return false;

            }


            const state =
                this.get();


            if (
                !Array.isArray(
                    state.savedOpportunities
                )
            ) {

                state.savedOpportunities =
                    [];

            }


            if (
                state.savedOpportunities
                    .includes(
                        opportunityId
                    )
            ) {

                return false;

            }


            state.savedOpportunities.push(
                opportunityId
            );


            this.save();


            this.notify(
                "opportunity-added",
                {

                    opportunityId:
                        opportunityId

                }
            );


            EventBus.emit(
                CONSTANTS.EVENTS
                    .OPPORTUNITY_ADDED,
                {

                    opportunityId:
                        opportunityId

                }
            );


            return true;

        };


    State.removeOpportunity =
        function (
            opportunityId
        ) {

            const state =
                this.get();


            if (
                !Array.isArray(
                    state.savedOpportunities
                )
            ) {

                return false;

            }


            const previousLength =
                state.savedOpportunities.length;


            state.savedOpportunities =
                state.savedOpportunities.filter(
                    function (
                        id
                    ) {

                        return (
                            id !==
                            opportunityId
                        );

                    }
                );


            if (
                state.savedOpportunities.length ===
                previousLength
            ) {

                return false;

            }


            this.save();


            this.notify(
                "opportunity-removed",
                {

                    opportunityId:
                        opportunityId

                }
            );


            return true;

        };


/* ==========================================================================
   19 — BLUEPRINT RESET
   ========================================================================== */

    State.reset =
        function () {

            const fresh =
                cloneObject(
                    DEFAULT_BLUEPRINT_STATE
                );


            this.data =
                fresh;


            this.save();


            this.notify(
                "blueprint-reset"
            );


            EventBus.emit(
                CONSTANTS.EVENTS
                    .BLUEPRINT_RESET,
                this.data
            );


            return this.data;

        };


/* ==========================================================================
   20 — PERFORMANCE PREFERENCE DETECTION
   ========================================================================== */

    function detectPerformancePreferences() {

        let reducedMotion =
            false;


        let saveData =
            false;


        try {

            reducedMotion =
                Boolean(
                    window.matchMedia &&
                    window.matchMedia(
                        "(prefers-reduced-motion: reduce)"
                    ).matches
                );

        } catch (error) {

            reducedMotion =
                false;

        }


        try {

            saveData =
                Boolean(
                    navigator.connection &&
                    navigator.connection.saveData
                );

        } catch (error) {

            saveData =
                false;

        }


        Runtime.reducedMotion =
            reducedMotion;


        Runtime.saveData =
            saveData;


        PathForage.config.performance =
            PathForage.config.performance ||
            {};


        PathForage.config.performance
            .reducedMotion =
            reducedMotion;


        PathForage.config.performance
            .saveData =
            saveData;


        if (
            reducedMotion
        ) {

            document.documentElement
                .classList.add(
                    "pf-reduced-motion"
                );

        }


        if (
            saveData
        ) {

            document.documentElement
                .classList.add(
                    "pf-save-data"
                );

        }

    }


/* ==========================================================================
   21 — ONLINE / OFFLINE STATUS
   ========================================================================== */

    function updateNetworkStatus(
        isOnline
    ) {

        Runtime.isOnline =
            Boolean(
                isOnline
            );


        document.documentElement
            .classList.toggle(
                "pf-offline",
                !Runtime.isOnline
            );


        EventBus.emit(
            "pathforage:network",
            {

                online:
                    Runtime.isOnline

            }
        );

    }


    window.addEventListener(
        "online",
        function () {

            updateNetworkStatus(
                true
            );

        }
    );


    window.addEventListener(
        "offline",
        function () {

            updateNetworkStatus(
                false
            );

        }
    );


/* ==========================================================================
   22 — ACCESSIBILITY ANNOUNCER
   ========================================================================== */

    function announce(
        message
    ) {

        const announcer =
            DOM.byId(
                "pf-screen-reader-announcer"
            );


        if (
            !announcer ||
            !message
        ) {

            return;

        }


        announcer.textContent =
            "";


        /*
         * A short asynchronous update gives assistive technologies a clear
         * live-region change instead of repeatedly reading stale content.
         */

        window.setTimeout(
            function () {

                announcer.textContent =
                    String(
                        message
                    );

            },
            20
        );

    }


    PathForage.accessibility =
        PathForage.accessibility ||
        {};


    PathForage.accessibility
        .announce =
        announce;


/* ==========================================================================
   23 — APPLICATION READY STATE
   ========================================================================== */

    function setApplicationReady() {

        document.documentElement
            .setAttribute(
                "data-pathforage-ready",
                "true"
            );


        Runtime.initializedAt =
            Date.now();


        PathForage.initialized =
            true;


        EventBus.emit(
            CONSTANTS.EVENTS.READY,
            {

                timestamp:
                    Runtime.initializedAt,

                version:
                    PathForage.version

            }
        );

    }


/* ==========================================================================
   24 — INITIALIZATION FOUNDATION
   ========================================================================== */

    function initializeFoundation() {

        if (
            PathForage.initialized
        ) {

            return;

        }


        detectPerformancePreferences();


        State.initialize();


        updateNetworkStatus(
            Runtime.isOnline
        );


        setApplicationReady();

    }


/* ==========================================================================
   25 — PUBLIC FOUNDATION API
   ========================================================================== */

    PathForage.initialize =
        initializeFoundation;


    PathForage.getVersion =
        function () {

            return PathForage.version;

        };


    PathForage.getRuntime =
        function () {

            return {

                isBrowser:
                    Runtime.isBrowser,

                isOnline:
                    Runtime.isOnline,

                reducedMotion:
                    Runtime.reducedMotion,

                saveData:
                    Runtime.saveData,

                initializedAt:
                    Runtime.initializedAt

            };

        };


/* ==========================================================================
   26 — DOM READY BOOTSTRAP
   ========================================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeFoundation,
            {
                once:
                    true
            }
        );

    } else {

        initializeFoundation();

    }


/* ==========================================================================
   27 — GLOBAL ERROR ISOLATION
   ========================================================================== */

    window.addEventListener(
        "error",
        function (event) {

            /*
             * PathForage should not crash because an optional enhancement
             * failed. We intentionally do not expose internal errors to
             * the user interface here.
             */

            Debug.error(
                "Runtime error detected.",
                event &&
                event.error
                    ? event.error
                    : event
            );

        }
    );


    window.addEventListener(
        "unhandledrejection",
        function (event) {

            Debug.error(
                "Unhandled promise rejection detected.",
                event &&
                event.reason
                    ? event.reason
                    : event
            );

        }
    );


/* ==========================================================================
   28 — FOUNDATION EXPORT
   ========================================================================== */

    /*
     * Expose the primary objects that later parts will extend.
     *
     * Keeping these references stable allows Part 2 onward to add modules
     * without repeatedly replacing the global PathForage object.
     */

    PathForage.modules =
        PathForage.modules ||
        {};


    PathForage.modules.core =
        {

            constants:
                CONSTANTS,

            dom:
                DOM,

            events:
                EventBus,

            storage:
                Storage,

            state:
                State,

            analytics:
                Analytics

        };


/* ==========================================================================
   END OF PART 1
   --------------------------------------------------------------------------
   PART 2 MUST CONTINUE DIRECTLY BELOW THIS LINE.

   The next layer will build on this foundation with:

   - opportunity repository
   - opportunity normalization
   - search engine
   - filter engine
   - sorting
   - opportunity-card synchronization
   - save/add interactions
   - Blueprint UI synchronization
   - state-to-DOM rendering

   DO NOT ADD:
   - </script>
   - HTML
   - CSS
   - closing document tags
   ========================================================================== */

})(window, document);
    function initializeFoundation() {

        initializeCapabilities();

        initializeNetworkListeners();

        runtime.storageAvailable =
            detectStorage();

        runtime.analyticsAvailable =
            detectAnalytics();

        runtime.adsenseAvailable =
            detectAdSense();

    }


    /* ======================================================================
       036 — CAPABILITY DETECTION
       ====================================================================== */

    function initializeCapabilities() {

        runtime.capabilities =
            runtime.capabilities ||
            {};

        runtime.capabilities.dom =
            typeof document !==
                "undefined";

        runtime.capabilities.window =
            typeof window !==
                "undefined";

        runtime.capabilities.localStorage =
            runtime.storageAvailable;

        runtime.capabilities.sessionStorage =
            detectSessionStorage();

        runtime.capabilities.intersectionObserver =
            typeof window !==
                "undefined" &&
            "IntersectionObserver" in
                window;

        runtime.capabilities.resizeObserver =
            typeof window !==
                "undefined" &&
            "ResizeObserver" in
                window;

        runtime.capabilities.mutationObserver =
            typeof window !==
                "undefined" &&
            "MutationObserver" in
                window;

        runtime.capabilities.requestIdleCallback =
            typeof window !==
                "undefined" &&
            "requestIdleCallback" in
                window;

        runtime.capabilities.requestAnimationFrame =
            typeof window !==
                "undefined" &&
            "requestAnimationFrame" in
                window;

        runtime.capabilities.fetch =
            typeof window !==
                "undefined" &&
            typeof window.fetch ===
                "function";

        runtime.capabilities.serviceWorker =
            typeof navigator !==
                "undefined" &&
            "serviceWorker" in
                navigator;

        runtime.capabilities.online =
            typeof navigator !==
                "undefined"
                ? navigator.onLine
                : true;

        runtime.capabilities.reducedMotion =
            detectReducedMotion();

        runtime.capabilities.saveData =
            detectSaveData();

    }


    /* ======================================================================
       037 — SESSION STORAGE DETECTION
       ====================================================================== */

    function detectSessionStorage() {

        if (
            typeof window ===
                "undefined"
        ) {

            return false;

        }

        try {

            var storage =
                window.sessionStorage;

            var testKey =
                "__pf_session_test__";

            storage.setItem(
                testKey,
                "1"
            );

            storage.removeItem(
                testKey
            );

            return true;

        }
        catch (
            error
        ) {

            return false;

        }

    }


    /* ======================================================================
       038 — REDUCED MOTION DETECTION
       ====================================================================== */

    function detectReducedMotion() {

        if (
            typeof window ===
                "undefined" ||
            typeof window.matchMedia !==
                "function"
        ) {

            return false;

        }

        try {

            return window
                .matchMedia(
                    "(prefers-reduced-motion: reduce)"
                )
                .matches;

        }
        catch (
            error
        ) {

            return false;

        }

    }


    /* ======================================================================
       039 — SAVE-DATA DETECTION
       ====================================================================== */

    function detectSaveData() {

        if (
            typeof navigator ===
                "undefined"
        ) {

            return false;

        }

        try {

            return Boolean(
                navigator.connection &&
                navigator.connection.saveData
            );

        }
        catch (
            error
        ) {

            return false;

        }

    }


    /* ======================================================================
       040 — NETWORK INFORMATION
       ====================================================================== */

    function getNetworkInformation() {

        if (
            typeof navigator ===
                "undefined"
        ) {

            return null;

        }

        return (
            navigator.connection ||
            navigator.mozConnection ||
            navigator.webkitConnection ||
            null
        );

    }


    /* ======================================================================
       041 — NETWORK STATE
       ====================================================================== */

    function getNetworkState() {

        var connection =
            getNetworkInformation();

        var online =
            typeof navigator !==
                "undefined"
                ? navigator.onLine
                : true;

        return {

            online:
                online,

            effectiveType:
                connection &&
                connection.effectiveType
                    ? connection.effectiveType
                    : "unknown",

            downlink:
                connection &&
                typeof connection.downlink ===
                    "number"
                    ? connection.downlink
                    : null,

            rtt:
                connection &&
                typeof connection.rtt ===
                    "number"
                    ? connection.rtt
                    : null,

            saveData:
                connection &&
                Boolean(
                    connection.saveData
                )

        };

    }


    /* ======================================================================
       042 — NETWORK LISTENERS
       ====================================================================== */

    function initializeNetworkListeners() {

        if (
            typeof window ===
                "undefined"
        ) {

            return;

        }

        window.addEventListener(
            "online",
            function () {

                runtime.network =
                    getNetworkState();

                document.documentElement
                    .setAttribute(
                        "data-pathforage-online",
                        "true"
                    );

                emit(
                    "network:online",
                    runtime.network
                );

            }
        );


        window.addEventListener(
            "offline",
            function () {

                runtime.network =
                    getNetworkState();

                document.documentElement
                    .setAttribute(
                        "data-pathforage-online",
                        "false"
                    );

                emit(
                    "network:offline",
                    runtime.network
                );

            }
        );


        var connection =
            getNetworkInformation();

        if (
            connection &&
            typeof connection.addEventListener ===
                "function"
        ) {

            connection.addEventListener(
                "change",
                function () {

                    runtime.network =
                        getNetworkState();

                    emit(
                        "network:change",
                        runtime.network
                    );

                }
            );

        }

    }


    /* ======================================================================
       043 — EVENT BUS
       ====================================================================== */

    var eventBus = {};


    function on(
        eventName,
        handler
    ) {

        if (
            !isString(eventName) ||
            !isFunction(handler)
        ) {

            return function () {};

        }

        if (
            !Array.isArray(
                eventBus[eventName]
            )
        ) {

            eventBus[eventName] =
                [];

        }

        eventBus[eventName]
            .push(handler);

        return function () {

            off(
                eventName,
                handler
            );

        };

    }


    function off(
        eventName,
        handler
    ) {

        var listeners =
            eventBus[eventName];

        if (
            !Array.isArray(listeners)
        ) {

            return;

        }

        eventBus[eventName] =
            listeners.filter(
                function (
                    listener
                ) {

                    return listener !==
                        handler;

                }
            );

    }


    function emit(
        eventName,
        payload
    ) {

        var listeners =
            eventBus[eventName];

        if (
            !Array.isArray(listeners)
        ) {

            return;

        }

        listeners
            .slice()
            .forEach(
                function (
                    listener
                ) {

                    try {

                        listener(
                            payload
                        );

                    }
                    catch (
                        error
                    ) {

                        reportError(
                            error,
                            {
                                source:
                                    "event-bus",
                                event:
                                    eventName
                            }
                        );

                    }

                }
            );

    }


    /* ======================================================================
       044 — ERROR REPORTING
       ====================================================================== */

    function reportError(
        error,
        context
    ) {

        var payload = {

            error:
                error instanceof Error
                    ? error.message
                    : String(error),

            context:
                context ||
                {},

            timestamp:
                new Date()
                    .toISOString()

        };


        runtime.errors =
            runtime.errors ||
            [];

        runtime.errors.push(
            payload
        );


        if (
            runtime.errors.length >
                50
        ) {

            runtime.errors =
                runtime.errors.slice(
                    -50
                );

        }


        emit(
            "error",
            payload
        );


        if (
            Config &&
            Config.debug &&
            typeof console !==
                "undefined" &&
            typeof console.error ===
                "function"
        ) {

            console.error(
                "[PathForage]",
                error,
                context
            );

        }

    }


    /* ======================================================================
       045 — PUBLIC EVENT API
       ====================================================================== */

    PathForage.events = {

        on:
            on,

        off:
            off,

        emit:
            emit

    };


    /* ======================================================================
       046 — RUNTIME NETWORK INITIALIZATION
       ====================================================================== */

    function initializeRuntimeNetwork() {

        runtime.network =
            getNetworkState();


        if (
            typeof document !==
                "undefined"
        ) {

            document.documentElement
                .setAttribute(
                    "data-pathforage-online",
                    runtime.network.online
                        ? "true"
                        : "false"
                );

        }

    }


    /* ======================================================================
       047 — ROOT ATTRIBUTE SYNCHRONIZATION
       ====================================================================== */

    function synchronizeRootState() {

        if (
            typeof document ===
                "undefined"
        ) {

            return;

        }

        var root =
            document.documentElement;


        root.setAttribute(
            "data-pathforage-runtime",
            "active"
        );


        root.setAttribute(
            "data-pathforage-storage",
            runtime.storageAvailable
                ? "available"
                : "unavailable"
        );


        root.setAttribute(
            "data-pathforage-analytics",
            runtime.analyticsAvailable
                ? "available"
                : "unavailable"
        );


        root.setAttribute(
            "data-pathforage-adsense",
            runtime.adsenseAvailable
                ? "available"
                : "unavailable"
        );


        root.setAttribute(
            "data-pathforage-reduced-motion",
            runtime.capabilities &&
            runtime.capabilities.reducedMotion
                ? "true"
                : "false"
        );


        root.setAttribute(
            "data-pathforage-save-data",
            runtime.capabilities &&
            runtime.capabilities.saveData
                ? "true"
                : "false"
        );

    }


    /* ======================================================================
       048 — DOM READY HANDLER
       ====================================================================== */

    function onDOMReady(
        callback
    ) {

        if (
            !isFunction(callback)
        ) {

            return;

        }


        if (
            typeof document ===
                "undefined"
        ) {

            return;

        }


        if (
            document.readyState ===
                "loading"
        ) {

            document.addEventListener(
                "DOMContentLoaded",
                callback,
                {
                    once:
                        true
                }
            );

        }
        else {

            callback();

        }

    }


    /* ======================================================================
       049 — APPLICATION BOOTSTRAP
       ====================================================================== */

    function bootstrap() {

        try {

            initializeFoundation();

            initializeRuntimeNetwork();

            synchronizeRootState();

            emit(
                "foundation:initialized",
                runtime
            );

        }
        catch (
            error
        ) {

            reportError(
                error,
                {
                    source:
                        "bootstrap"
                }
            );

        }

    }


    /* ======================================================================
       050 — PUBLIC BOOTSTRAP API
       ====================================================================== */

    PathForage.bootstrap =
        bootstrap;


    PathForage.ready =
        onDOMReady;


    /* ======================================================================
       051 — RUNTIME INSPECTION API
       ====================================================================== */

    PathForage.getRuntime =
        function () {

            return runtime;

        };


    PathForage.getNetwork =
        function () {

            runtime.network =
                getNetworkState();

            return runtime.network;

        };


    PathForage.getCapabilities =
        function () {

            return Object.assign(
                {},
                runtime.capabilities ||
                {}
            );

        };


    /* ======================================================================
       052 — APPLICATION VERSION
       ====================================================================== */

    PathForage.version =
        Config.version ||
        "1.0.0";


    /* ======================================================================
       053 — APPLICATION IDENTIFIER
       ====================================================================== */

    PathForage.appName =
        Config.name ||
        "PathForage";


    PathForage.appId =
        Config.appId ||
        "pathforage";


    /* ======================================================================
       054 — INITIALIZATION STATE
       ====================================================================== */

    runtime.initialized =
        false;

    runtime.booted =
        false;

    runtime.ready =
        false;


    /* ======================================================================
       055 — BOOTSTRAP COMPLETION
       ====================================================================== */

    function completeBootstrap() {

        if (
            runtime.booted
        ) {

            return;

        }


        runtime.booted =
            true;

        runtime.initialized =
            true;

        runtime.ready =
            true;


        if (
            typeof document !==
                "undefined"
        ) {

            document.documentElement
                .setAttribute(
                    "data-pathforage-ready",
                    "true"
                );

        }


        emit(
            "app:ready",
            {

                version:
                    PathForage.version,

                runtime:
                    runtime

            }
        );

    }


    /* ======================================================================
       056 — SAFE STARTUP
       ====================================================================== */

    onDOMReady(
        function () {

            try {

                bootstrap();

                completeBootstrap();

            }
            catch (
                error
            ) {

                reportError(
                    error,
                    {
                        source:
                            "startup"
                    }
                );

            }

        }
    );


    /* ======================================================================
       057 — GLOBAL ERROR BOUNDARY
       ====================================================================== */

    if (
        typeof window !==
            "undefined"
    ) {

        window.addEventListener(
            "error",
            function (
                event
            ) {

                if (
                    event &&
                    event.error
                ) {

                    reportError(
                        event.error,
                        {
                            source:
                                "window-error"
                        }
                    );

                }

            }
        );


        window.addEventListener(
            "unhandledrejection",
            function (
                event
            ) {

                reportError(
                    event &&
                    event.reason
                        ? event.reason
                        : "Unhandled promise rejection",
                    {
                        source:
                            "unhandled-rejection"
                    }
                );

            }
        );

    }


    /* ======================================================================
       058 — FINAL FOUNDATION EXPORT
       ====================================================================== */

    PathForage.foundation = {

        initialized:
            function () {

                return Boolean(
                    runtime.initialized
                );

            },

        ready:
            function () {

                return Boolean(
                    runtime.ready
                );

            },

        capabilities:
            function () {

                return PathForage
                    .getCapabilities();

            },

        network:
            function () {

                return PathForage
                    .getNetwork();

            }

    };


    /* ======================================================================
       059 — FOUNDATION PART 2 COMPLETE
       ----------------------------------------------------------------------
       Part 3 must continue directly below this line.

       DO NOT ADD:
       - </script>
       - <script>
       - HTML
       - CSS
       - closing document tags

       This remains one continuous standalone JavaScript file.
       ====================================================================== */
    /* ======================================================================
       060 — RUNTIME STATE ACCESSORS
       ====================================================================== */

    PathForage.state = {

        get:
            function (
                key
            ) {

                if (
                    !isString(key) ||
                    !key
                ) {

                    return undefined;

                }

                return runtime.state &&
                    Object.prototype
                        .hasOwnProperty
                        .call(
                            runtime.state,
                            key
                        )
                    ? runtime.state[key]
                    : undefined;

            },


        set:
            function (
                key,
                value
            ) {

                if (
                    !isString(key) ||
                    !key
                ) {

                    return false;

                }

                runtime.state =
                    runtime.state ||
                    {};

                runtime.state[key] =
                    value;

                emit(
                    "state:change",
                    {

                        key:
                            key,

                        value:
                            value

                    }
                );

                return true;

            },


        remove:
            function (
                key
            ) {

                if (
                    !isString(key) ||
                    !key
                ) {

                    return false;

                }

                if (
                    !runtime.state ||
                    !Object.prototype
                        .hasOwnProperty
                        .call(
                            runtime.state,
                            key
                        )
                ) {

                    return false;

                }

                delete runtime.state[key];

                emit(
                    "state:remove",
                    {

                        key:
                            key

                    }
                );

                return true;

            },


        snapshot:
            function () {

                return Object.assign(
                    {},
                    runtime.state ||
                    {}
                );

            }

    };


    runtime.state =
        runtime.state ||
        {};


    /* ======================================================================
       061 — STORAGE NAMESPACE
       ====================================================================== */

    var STORAGE_PREFIX =
        "pathforage:";


    function createStorageKey(
        key
    ) {

        return (
            STORAGE_PREFIX +
            String(key)
        );

    }


    /* ======================================================================
       062 — STORAGE SAFE READ
       ====================================================================== */

    function safeStorageRead(
        storage,
        key
    ) {

        if (
            !storage
        ) {

            return null;

        }

        try {

            return storage.getItem(
                key
            );

        }
        catch (
            error
        ) {

            reportError(
                error,
                {

                    source:
                        "storage-read",

                    key:
                        key

                }
            );

            return null;

        }

    }


    /* ======================================================================
       063 — STORAGE SAFE WRITE
       ====================================================================== */

    function safeStorageWrite(
        storage,
        key,
        value
    ) {

        if (
            !storage
        ) {

            return false;

        }

        try {

            storage.setItem(
                key,
                value
            );

            return true;

        }
        catch (
            error
        ) {

            reportError(
                error,
                {

                    source:
                        "storage-write",

                    key:
                        key

                }
            );

            return false;

        }

    }


    /* ======================================================================
       064 — STORAGE SAFE REMOVE
       ====================================================================== */

    function safeStorageRemove(
        storage,
        key
    ) {

        if (
            !storage
        ) {

            return false;

        }

        try {

            storage.removeItem(
                key
            );

            return true;

        }
        catch (
            error
        ) {

            reportError(
                error,
                {

                    source:
                        "storage-remove",

                    key:
                        key

                }
            );

            return false;

        }

    }


    /* ======================================================================
       065 — NAMESPACED STORAGE API
       ====================================================================== */

    PathForage.storage.namespace =
        STORAGE_PREFIX;


    PathForage.storage.has =
        function (
            key
        ) {

            if (
                !runtime.storageAvailable ||
                !isString(key)
            ) {

                return false;

            }

            if (
                typeof window ===
                    "undefined"
            ) {

                return false;

            }

            var storage =
                window.localStorage;

            return (
                safeStorageRead(
                    storage,
                    createStorageKey(
                        key
                    )
                ) !==
                null
            );

        };


    /* ======================================================================
       066 — STORAGE JSON READ
       ====================================================================== */

    PathForage.storage.getJSON =
        function (
            key,
            fallback
        ) {

            if (
                !runtime.storageAvailable ||
                !isString(key)
            ) {

                return fallback;

            }

            if (
                typeof window ===
                    "undefined"
            ) {

                return fallback;

            }

            var raw =
                safeStorageRead(
                    window.localStorage,
                    createStorageKey(
                        key
                    )
                );


            if (
                raw ===
                null
            ) {

                return fallback;

            }


            var parsed =
                parseJSON(
                    raw
                );


            return parsed ===
                null
                ? fallback
                : parsed;

        };


    /* ======================================================================
       067 — STORAGE JSON WRITE
       ====================================================================== */

    PathForage.storage.setJSON =
        function (
            key,
            value
        ) {

            if (
                !runtime.storageAvailable ||
                !isString(key)
            ) {

                return false;

            }

            if (
                typeof window ===
                    "undefined"
            ) {

                return false;

            }

            var serialized;

            try {

                serialized =
                    stringifyJSON(
                        value
                    );

            }
            catch (
                error
            ) {

                reportError(
                    error,
                    {

                        source:
                            "storage-json-serialize",

                        key:
                            key

                    }
                );

                return false;

            }


            return safeStorageWrite(
                window.localStorage,
                createStorageKey(
                    key
                ),
                serialized
            );

        };


    /* ======================================================================
       068 — STORAGE CLEAR NAMESPACE
       ====================================================================== */

    PathForage.storage.clearNamespace =
        function () {

            if (
                !runtime.storageAvailable ||
                typeof window ===
                    "undefined"
            ) {

                return false;

            }

            var storage =
                window.localStorage;


            try {

                var keys =
                    [];

                for (
                    var index = 0;
                    index <
                        storage.length;
                    index += 1
                ) {

                    var key =
                        storage.key(
                            index
                        );

                    if (
                        key &&
                        key.indexOf(
                            STORAGE_PREFIX
                        ) === 0
                    ) {

                        keys.push(
                            key
                        );

                    }

                }


                keys.forEach(
                    function (
                        key
                    ) {

                        storage.removeItem(
                            key
                        );

                    }
                );


                emit(
                    "storage:namespace-cleared",
                    {

                        count:
                            keys.length

                    }
                );


                return true;

            }
            catch (
                error
            ) {

                reportError(
                    error,
                    {

                        source:
                            "storage-clear"

                    }
                );

                return false;

            }

        };


    /* ======================================================================
       069 — PREFERENCE MANAGEMENT
       ====================================================================== */

    var PREFERENCE_KEY =
        "preferences";


    var defaultPreferences = {

        theme:
            "system",

        language:
            "en",

        reducedMotion:
            false,

        saveData:
            false,

        notifications:
            true,

        analytics:
            true,

        personalizedAds:
            true

    };


    function getPreferences() {

        var stored =
            PathForage.storage.getJSON(
                PREFERENCE_KEY,
                null
            );


        if (
            !stored ||
            typeof stored !==
                "object"
        ) {

            return Object.assign(
                {},
                defaultPreferences
            );

        }


        return Object.assign(
            {},
            defaultPreferences,
            stored
        );

    }


    function savePreferences(
        preferences
    ) {

        if (
            !preferences ||
            typeof preferences !==
                "object"
        ) {

            return false;

        }

        var normalized =
            Object.assign(
                {},
                defaultPreferences,
                preferences
            );


        var saved =
            PathForage.storage
                .setJSON(
                    PREFERENCE_KEY,
                    normalized
                );


        if (
            saved
        ) {

            runtime.preferences =
                normalized;

            emit(
                "preferences:change",
                normalized
            );

        }


        return saved;

    }


    PathForage.preferences = {

        defaults:
            Object.assign(
                {},
                defaultPreferences
            ),

        get:
            function () {

                if (
                    !runtime.preferences
                ) {

                    runtime.preferences =
                        getPreferences();

                }

                return Object.assign(
                    {},
                    runtime.preferences
                );

            },

        set:
            function (
                preferences
            ) {

                return savePreferences(
                    Object.assign(
                        {},
                        PathForage.preferences
                            .get(),
                        preferences
                    )
                );

            },

        reset:
            function () {

                return savePreferences(
                    Object.assign(
                        {},
                        defaultPreferences
                    )
                );

            }

    };


    runtime.preferences =
        getPreferences();


    /* ======================================================================
       070 — PREFERENCE ATTRIBUTE SYNCHRONIZATION
       ====================================================================== */

    function synchronizePreferences() {

        if (
            typeof document ===
                "undefined"
        ) {

            return;

        }


        var preferences =
            PathForage.preferences
                .get();


        var root =
            document.documentElement;


        root.setAttribute(
            "data-pathforage-language",
            preferences.language
        );


        root.setAttribute(
            "data-pathforage-theme",
            preferences.theme
        );


        root.setAttribute(
            "data-pathforage-notifications",
            preferences.notifications
                ? "enabled"
                : "disabled"
        );


        root.setAttribute(
            "data-pathforage-personalized-ads",
            preferences.personalizedAds
                ? "enabled"
                : "disabled"
        );


        if (
            preferences.reducedMotion
        ) {

            root.classList.add(
                "pf-reduced-motion"
            );

        }
        else {

            root.classList.remove(
                "pf-reduced-motion"
            );

        }


        if (
            preferences.saveData
        ) {

            root.classList.add(
                "pf-save-data"
            );

        }
        else {

            root.classList.remove(
                "pf-save-data"
            );

        }

    }


    on(
        "preferences:change",
        function () {

            synchronizePreferences();

        }
    );


    /* ======================================================================
       071 — THEME RESOLUTION
       ====================================================================== */

    function resolveTheme(
        theme
    ) {

        if (
            theme ===
                "dark"
        ) {

            return "dark";

        }

        if (
            theme ===
                "light"
        ) {

            return "light";

        }


        if (
            typeof window !==
                "undefined" &&
            typeof window.matchMedia ===
                "function"
        ) {

            try {

                return window
                    .matchMedia(
                        "(prefers-color-scheme: dark)"
                    )
                    .matches
                    ? "dark"
                    : "light";

            }
            catch (
                error
            ) {}

        }


        return "dark";

    }


    /* ======================================================================
       072 — THEME APPLICATION
       ====================================================================== */

    function applyTheme() {

        if (
            typeof document ===
                "undefined"
        ) {

            return;

        }


        var preferences =
            PathForage.preferences
                .get();


        var resolved =
            resolveTheme(
                preferences.theme
            );


        document.documentElement
            .setAttribute(
                "data-pathforage-resolved-theme",
                resolved
            );


        document.documentElement
            .classList.toggle(
                "pf-theme-dark",
                resolved ===
                    "dark"
            );


        document.documentElement
            .classList.toggle(
                "pf-theme-light",
                resolved ===
                    "light"
            );

    }


    /* ======================================================================
       073 — SYSTEM THEME LISTENER
       ====================================================================== */

    function initializeThemeListener() {

        if (
            typeof window ===
                "undefined" ||
            typeof window.matchMedia !==
                "function"
        ) {

            return;

        }


        var mediaQuery;


        try {

            mediaQuery =
                window.matchMedia(
                    "(prefers-color-scheme: dark)"
                );

        }
        catch (
            error
        ) {

            return;

        }


        var handleChange =
            function () {

                var preferences =
                    PathForage.preferences
                        .get();

                if (
                    preferences.theme ===
                        "system"
                ) {

                    applyTheme();

                    emit(
                        "theme:system-change",
                        {
                            theme:
                                resolveTheme(
                                    "system"
                                )
                        }
                    );

                }

            };


        if (
            typeof mediaQuery
                .addEventListener ===
                "function"
        ) {

            mediaQuery.addEventListener(
                "change",
                handleChange
            );

        }
        else if (
            typeof mediaQuery
                .addListener ===
                "function"
        ) {

            mediaQuery.addListener(
                handleChange
            );

        }

    }


    /* ======================================================================
       074 — ACCESSIBILITY PREFERENCE SYNC
       ====================================================================== */

    function synchronizeAccessibility() {

        if (
            typeof document ===
                "undefined"
        ) {

            return;

        }


        var preferences =
            PathForage.preferences
                .get();


        var reducedMotion =
            preferences.reducedMotion ||
            detectReducedMotion();


        var saveData =
            preferences.saveData ||
            detectSaveData();


        document.documentElement
            .classList.toggle(
                "pf-reduced-motion",
                reducedMotion
            );


        document.documentElement
            .classList.toggle(
                "pf-save-data",
                saveData
            );

    }


    /* ======================================================================
       075 — PREFERENCE INITIALIZATION
       ====================================================================== */

    function initializePreferences() {

        runtime.preferences =
            getPreferences();

        synchronizePreferences();

        synchronizeAccessibility();

        applyTheme();

        initializeThemeListener();

    }


    /* ======================================================================
       076 — FOUNDATION EXTENSION REGISTRATION
       ====================================================================== */

    PathForage.foundation.preferences =
        initializePreferences;


    /* ======================================================================
       077 — DEFERRED PREFERENCE INITIALIZATION
       ====================================================================== */

    onDOMReady(
        function () {

            try {

                initializePreferences();

            }
            catch (
                error
            ) {

                reportError(
                    error,
                    {

                        source:
                            "preference-initialization"

                    }
                );

            }

        }
    );


    /* ======================================================================
       078 — PART 3 COMPLETE
       ----------------------------------------------------------------------
       Part 4 must continue directly below this line.

       DO NOT ADD:
       - </script>
       - <script>
       - HTML
       - CSS
       - closing document tags

       This remains one continuous standalone JavaScript file.
       ====================================================================== */
    /* ======================================================================
       079 — APPLICATION EVENT REGISTRY
       ====================================================================== */

    var applicationEvents = {

        initialized:
            "app:initialized",

        ready:
            "app:ready",

        boot:
            "app:boot",

        error:
            "error",

        networkOnline:
            "network:online",

        networkOffline:
            "network:offline",

        networkChange:
            "network:change",

        preferenceChange:
            "preferences:change",

        themeChange:
            "theme:change",

        storageChange:
            "storage:change"

    };


    PathForage.events.names =
        Object.assign(
            {},
            applicationEvents
        );


    /* ======================================================================
       080 — APPLICATION EVENT HELPER
       ====================================================================== */

    function emitApplicationEvent(
        eventName,
        detail
    ) {

        emit(
            eventName,
            detail
        );


        if (
            typeof document !==
                "undefined" &&
            typeof window.CustomEvent ===
                "function"
        ) {

            try {

                document.dispatchEvent(
                    new CustomEvent(
                        eventName,
                        {
                            detail:
                                detail
                        }
                    )
                );

            }
            catch (
                error
            ) {

                reportError(
                    error,
                    {

                        source:
                            "dom-event",

                        event:
                            eventName

                    }
                );

            }

        }

    }


    /* ======================================================================
       081 — APPLICATION METADATA
       ====================================================================== */

    runtime.metadata =
        runtime.metadata ||
        {

            createdAt:
                new Date()
                    .toISOString(),

            platform:
                typeof navigator !==
                    "undefined"
                    ? navigator.platform ||
                      "unknown"
                    : "unknown",

            language:
                typeof navigator !==
                    "undefined"
                    ? navigator.language ||
                      "en"
                    : "en"

        };


    PathForage.metadata =
        function () {

            return Object.assign(
                {},
                runtime.metadata
            );

        };


    /* ======================================================================
       082 — DEVICE INFORMATION
       ====================================================================== */

    function getDeviceInformation() {

        if (
            typeof window ===
                "undefined" ||
            typeof navigator ===
                "undefined"
        ) {

            return {

                type:
                    "unknown",

                mobile:
                    false,

                touch:
                    false

            };

        }


        var width =
            window.innerWidth ||
            0;


        var touch =
            "ontouchstart" in
                window ||
            navigator.maxTouchPoints >
                0;


        var mobile =
            width <=
                767 ||
            /Android|iPhone|iPad|iPod/i
                .test(
                    navigator.userAgent ||
                    ""
                );


        var type =
            mobile
                ? "mobile"
                : width <= 1024
                    ? "tablet"
                    : "desktop";


        return {

            type:
                type,

            mobile:
                mobile,

            tablet:
                type ===
                    "tablet",

            desktop:
                type ===
                    "desktop",

            touch:
                touch,

            width:
                width,

            height:
                window.innerHeight ||
                0,

            pixelRatio:
                window.devicePixelRatio ||
                1

        };

    }


    runtime.device =
        getDeviceInformation();


    PathForage.device = {

        get:
            function () {

                runtime.device =
                    getDeviceInformation();

                return Object.assign(
                    {},
                    runtime.device
                );

            },

        refresh:
            function () {

                runtime.device =
                    getDeviceInformation();

                emit(
                    "device:change",
                    runtime.device
                );

                return runtime.device;

            }

    };


    /* ======================================================================
       083 — VIEWPORT SYNCHRONIZATION
       ====================================================================== */

    function synchronizeViewport() {

        if (
            typeof document ===
                "undefined" ||
            typeof window ===
                "undefined"
        ) {

            return;

        }


        var device =
            getDeviceInformation();


        runtime.device =
            device;


        var root =
            document.documentElement;


        root.setAttribute(
            "data-pathforage-device",
            device.type
        );


        root.setAttribute(
            "data-pathforage-touch",
            device.touch
                ? "true"
                : "false"
        );


        root.style.setProperty(
            "--pf-viewport-width",
            device.width +
            "px"
        );


        root.style.setProperty(
            "--pf-viewport-height",
            device.height +
            "px"
        );


        root.style.setProperty(
            "--pf-device-pixel-ratio",
            String(
                device.pixelRatio
            )
        );

    }


    /* ======================================================================
       084 — RESIZE OBSERVER
       ====================================================================== */

    function initializeViewportObserver() {

        if (
            typeof window ===
                "undefined"
        ) {

            return;

        }


        var resizeTimer =
            null;


        window.addEventListener(
            "resize",
            function () {

                if (
                    resizeTimer !==
                    null
                ) {

                    clearTimeout(
                        resizeTimer
                    );

                }


                resizeTimer =
                    setTimeout(
                        function () {

                            resizeTimer =
                                null;

                            synchronizeViewport();

                            emit(
                                "viewport:change",
                                PathForage.device
                                    .get()
                            );

                        },
                        120
                    );

            },
            {
                passive:
                    true
            }
        );


        window.addEventListener(
            "orientationchange",
            function () {

                setTimeout(
                    function () {

                        synchronizeViewport();

                        emit(
                            "viewport:orientation",
                            PathForage.device
                                .get()
                        );

                    },
                    100
                );

            },
            {
                passive:
                    true
            }
        );

    }


    /* ======================================================================
       085 — VISIBILITY STATE
       ====================================================================== */

    function getVisibilityState() {

        if (
            typeof document ===
                "undefined"
        ) {

            return "visible";

        }


        return document.visibilityState ||
            "visible";

    }


    runtime.visibility =
        getVisibilityState();


    function synchronizeVisibility() {

        runtime.visibility =
            getVisibilityState();


        emit(
            "visibility:change",
            {

                state:
                    runtime.visibility

            }
        );

    }


    /* ======================================================================
       086 — VISIBILITY LISTENER
       ====================================================================== */

    function initializeVisibilityListener() {

        if (
            typeof document ===
                "undefined"
        ) {

            return;

        }


        document.addEventListener(
            "visibilitychange",
            synchronizeVisibility
        );

    }


    /* ======================================================================
       087 — FOCUS STATE
       ====================================================================== */

    function initializeFocusListeners() {

        if (
            typeof window ===
                "undefined"
        ) {

            return;

        }


        window.addEventListener(
            "focus",
            function () {

                runtime.focused =
                    true;

                emit(
                    "window:focus",
                    {

                        focused:
                            true

                    }
                );

            }
        );


        window.addEventListener(
            "blur",
            function () {

                runtime.focused =
                    false;

                emit(
                    "window:blur",
                    {

                        focused:
                            false

                    }
                );

            }
        );


        runtime.focused =
            true;

    }


    /* ======================================================================
       088 — INTERACTION MODE
       ====================================================================== */

    function initializeInteractionMode() {

        if (
            typeof document ===
                "undefined"
        ) {

            return;

        }


        var root =
            document.documentElement;


        var pointerMode =
            function () {

                root.classList
                    .remove(
                        "pf-keyboard-navigation"
                    );

                root.classList
                    .add(
                        "pf-pointer-navigation"
                    );

            };


        var keyboardMode =
            function (
                event
            ) {

                if (
                    event.key !==
                    "Tab"
                ) {

                    return;

                }


                root.classList
                    .remove(
                        "pf-pointer-navigation"
                    );

                root.classList
                    .add(
                        "pf-keyboard-navigation"
                    );

            };


        document.addEventListener(
            "pointerdown",
            pointerMode,
            {
                passive:
                    true
            }
        );


        document.addEventListener(
            "keydown",
            keyboardMode
        );

    }


    /* ======================================================================
       089 — SAFE FOCUS MANAGEMENT
       ====================================================================== */

    function focusElement(
        element,
        options
    ) {

        if (
            !element ||
            typeof element.focus !==
                "function"
        ) {

            return false;

        }


        var settings =
            Object.assign(
                {

                    preventScroll:
                        false

                },
                options ||
                {}
            );


        try {

            element.focus(
                settings
            );

            return true;

        }
        catch (
            error
        ) {

            try {

                element.focus();

                return true;

            }
            catch (
                focusError
            ) {

                reportError(
                    focusError,
                    {

                        source:
                            "focus-management"

                    }
                );

                return false;

            }

        }

    }


    PathForage.accessibility = {

        focus:
            focusElement,

        announce:
            announce,

        reducedMotion:
            function () {

                return Boolean(
                    PathForage.preferences
                        .get()
                        .reducedMotion ||
                    detectReducedMotion()
                );

            }

    };


    /* ======================================================================
       090 — ANNOUNCEMENT REGION
       ====================================================================== */

    function initializeAnnouncementRegion() {

        if (
            typeof document ===
                "undefined"
        ) {

            return null;

        }


        var existing =
            document.getElementById(
                "pf-live-region"
            );


        if (
            existing
        ) {

            return existing;

        }


        var region =
            document.createElement(
                "div"
            );


        region.id =
            "pf-live-region";


        region.className =
            "pf-visually-hidden";


        region.setAttribute(
            "aria-live",
            "polite"
        );


        region.setAttribute(
            "aria-atomic",
            "true"
        );


        region.setAttribute(
            "role",
            "status"
        );


        document.body.appendChild(
            region
        );


        return region;

    }


    /* ======================================================================
       091 — ACCESSIBLE ANNOUNCEMENT
       ====================================================================== */

    function announceAccessible(
        message,
        priority
    ) {

        if (
            !isString(message) ||
            !message.trim()
        ) {

            return false;

        }


        if (
            typeof document ===
                "undefined"
        ) {

            return false;

        }


        var region =
            initializeAnnouncementRegion();


        if (
            !region
        ) {

            return false;

        }


        if (
            priority ===
                "assertive"
        ) {

            region.setAttribute(
                "aria-live",
                "assertive"
            );

        }
        else {

            region.setAttribute(
                "aria-live",
                "polite"
            );

        }


        region.textContent =
            "";


        setTimeout(
            function () {

                region.textContent =
                    message;

            },
            20
        );


        return true;

    }


    PathForage.accessibility
        .announce =
            announceAccessible;


    /* ======================================================================
       092 — SAFE ID GENERATOR
       ====================================================================== */

    var generatedIdCounter =
        0;


    function createId(
        prefix
    ) {

        generatedIdCounter +=
            1;


        var base =
            isString(prefix) &&
            prefix
                ? prefix
                : "pf";


        return (
            base +
            "-" +
            Date.now()
                .toString(36) +
            "-" +
            generatedIdCounter
                .toString(36)
        );

    }


    PathForage.utils.createId =
        createId;


    /* ======================================================================
       093 — DOM ELEMENT CREATION
       ====================================================================== */

    function createElement(
        tagName,
        options
    ) {

        if (
            typeof document ===
                "undefined" ||
            !isString(tagName)
        ) {

            return null;

        }


        var element =
            document.createElement(
                tagName
            );


        var settings =
            options &&
            typeof options ===
                "object"
                ? options
                : {};


        if (
            isString(
                settings.id
            )
        ) {

            element.id =
                settings.id;

        }


        if (
            isString(
                settings.className
            )
        ) {

            element.className =
                settings.className;

        }


        if (
            settings.attributes &&
            typeof settings.attributes ===
                "object"
        ) {

            Object.keys(
                settings.attributes
            )
            .forEach(
                function (
                    attribute
                ) {

                    var value =
                        settings.attributes[
                            attribute
                        ];


                    if (
                        value !==
                        null &&
                        value !==
                        undefined
                    ) {

                        element.setAttribute(
                            attribute,
                            String(value)
                        );

                    }

                }
            );

        }


        if (
            isString(
                settings.text
            )
        ) {

            element.textContent =
                settings.text;

        }


        return element;

    }


    PathForage.utils
        .createElement =
            createElement;


    /* ======================================================================
       094 — ELEMENT VISIBILITY HELPERS
       ====================================================================== */

    function setElementVisibility(
        element,
        visible
    ) {

        if (
            !element
        ) {

            return false;

        }


        if (
            visible
        ) {

            showElement(
                element
            );

        }
        else {

            hideElement(
                element
            );

        }


        return true;

    }


    PathForage.utils
        .setElementVisibility =
            setElementVisibility;


    /* ======================================================================
       095 — CLASS HELPERS
       ====================================================================== */

    function addClass(
        element,
        className
    ) {

        if (
            !element ||
            !isString(className)
        ) {

            return false;

        }


        var classes =
            className
                .trim()
                .split(/\s+/);


        classes.forEach(
            function (
                name
            ) {

                if (
                    name
                ) {

                    element.classList
                        .add(
                            name
                        );

                }

            }
        );


        return true;

    }


    function removeClass(
        element,
        className
    ) {

        if (
            !element ||
            !isString(className)
        ) {

            return false;

        }


        var classes =
            className
                .trim()
                .split(/\s+/);


        classes.forEach(
            function (
                name
            ) {

                if (
                    name
                ) {

                    element.classList
                        .remove(
                            name
                        );

                }

            }
        );


        return true;

    }


    function toggleClass(
        element,
        className,
        force
    ) {

        if (
            !element ||
            !isString(className)
        ) {

            return false;

        }


        if (
            typeof force ===
                "boolean"
        ) {

            element.classList
                .toggle(
                    className,
                    force
                );

        }
        else {

            element.classList
                .toggle(
                    className
                );

        }


        return true;

    }


    PathForage.utils.addClass =
        addClass;

    PathForage.utils.removeClass =
        removeClass;

    PathForage.utils.toggleClass =
        toggleClass;


    /* ======================================================================
       096 — ATTRIBUTE HELPERS
       ====================================================================== */

    function setAttribute(
        element,
        name,
        value
    ) {

        if (
            !element ||
            !isString(name)
        ) {

            return false;

        }


        if (
            value ===
                null ||
            value ===
                undefined
        ) {

            element.removeAttribute(
                name
            );

            return true;

        }


        element.setAttribute(
            name,
            String(value)
        );


        return true;

    }


    function getAttribute(
        element,
        name,
        fallback
    ) {

        if (
            !element ||
            !isString(name)
        ) {

            return fallback;

        }


        var value =
            element.getAttribute(
                name
            );


        return value ===
            null
            ? fallback
            : value;

    }


    PathForage.utils
        .setAttribute =
            setAttribute;

    PathForage.utils
        .getAttribute =
            getAttribute;


    /* ======================================================================
       097 — DOM EVENT HELPER
       ====================================================================== */

    function listen(
        element,
        eventName,
        handler,
        options
    ) {

        if (
            !element ||
            !isString(eventName) ||
            !isFunction(handler) ||
            typeof element
                .addEventListener !==
                "function"
        ) {

            return function () {};

        }


        element.addEventListener(
            eventName,
            handler,
            options ||
            false
        );


        return function () {

            element.removeEventListener(
                eventName,
                handler,
                options ||
                false
            );

        };

    }


    PathForage.utils.listen =
        listen;


    /* ======================================================================
       098 — DELEGATED EVENT HELPER
       ====================================================================== */

    function delegate(
        root,
        eventName,
        selector,
        handler,
        options
    ) {

        if (
            !root ||
            !isString(eventName) ||
            !isString(selector) ||
            !isFunction(handler)
        ) {

            return function () {};

        }


        var listener =
            function (
                event
            ) {

                var target =
                    event.target;


                if (
                    !target ||
                    typeof target.closest !==
                        "function"
                ) {

                    return;

                }


                var matched =
                    target.closest(
                        selector
                    );


                if (
                    !matched ||
                    !root.contains(
                        matched
                    )
                ) {

                    return;

                }


                handler.call(
                    matched,
                    event,
                    matched
                );

            };


        root.addEventListener(
            eventName,
            listener,
            options ||
            false
        );


        return function () {

            root.removeEventListener(
                eventName,
                listener,
                options ||
                false
            );

        };

    }


    PathForage.utils.delegate =
        delegate;


    /* ======================================================================
       099 — VIEWPORT FOUNDATION INITIALIZATION
       ====================================================================== */

    onDOMReady(
        function () {

            try {

                synchronizeViewport();

                initializeViewportObserver();

                initializeVisibilityListener();

                initializeFocusListeners();

                initializeInteractionMode();

                initializeAnnouncementRegion();

            }
            catch (
                error
            ) {

                reportError(
                    error,
                    {

                        source:
                            "viewport-foundation"

                    }
                );

            }

        }
    );


    /* ======================================================================
       100 — PART 4 COMPLETE
       ----------------------------------------------------------------------
       Part 5 must continue directly below this line.

       DO NOT ADD:
       - </script>
       - <script>
       - HTML
       - CSS
       - closing document tags

       This remains one continuous standalone JavaScript file.
       ====================================================================== */
/* ==========================================================================
   036 — NETWORK / ONLINE STATE
   ========================================================================== */

function initializeNetworkListeners() {

    function updateNetworkState() {

        runtime.online =
            navigator.onLine !== false;

        document.documentElement.toggleAttribute(
            "data-pathforage-offline",
            !runtime.online
        );

        document.documentElement.dataset.pathforageNetwork =
            runtime.online
                ? "online"
                : "offline";

        announce(
            runtime.online
                ? "Connection restored."
                : "You are currently offline."
        );

    }


    window.addEventListener(
        "online",
        updateNetworkState,
        {
            passive:
                true
        }
    );


    window.addEventListener(
        "offline",
        updateNetworkState,
        {
            passive:
                true
        }
    );


    updateNetworkState();

}


/* ==========================================================================
   037 — STORAGE DETECTION
   ========================================================================== */

function detectStorage() {

    try {

        var testKey =
            "__pf_storage_test__";

        window.localStorage.setItem(
            testKey,
            "1"
        );

        window.localStorage.removeItem(
            testKey
        );

        return true;

    } catch (error) {

        return false;

    }

}


/* ==========================================================================
   038 — ANALYTICS DETECTION
   ========================================================================== */

function detectAnalytics() {

    return (
        typeof window.gtag ===
            "function"
        ||
        Array.isArray(
            window.dataLayer
        )
    );

}


/* ==========================================================================
   039 — ADSENSE DETECTION
   ========================================================================== */

function detectAdSense() {

    return (
        Array.isArray(
            window.adsbygoogle
        )
        ||
        typeof window.adsbygoogle !==
            "undefined"
    );

}


/* ==========================================================================
   040 — STORAGE GET
   ========================================================================== */

function storageGet(
    key,
    fallback
) {

    if (
        !runtime.storageAvailable
        ||
        !isString(key)
    ) {

        return fallback;

    }


    try {

        var value =
            window.localStorage.getItem(
                key
            );


        if (
            value ===
            null
        ) {

            return fallback;

        }


        return parseJSON(
            value,
            value
        );

    } catch (error) {

        return fallback;

    }

}


/* ==========================================================================
   041 — STORAGE SET
   ========================================================================== */

function storageSet(
    key,
    value
) {

    if (
        !runtime.storageAvailable
        ||
        !isString(key)
    ) {

        return false;

    }


    try {

        window.localStorage.setItem(
            key,
            stringifyJSON(value)
        );

        return true;

    } catch (error) {

        return false;

    }

}


/* ==========================================================================
   042 — STORAGE REMOVE
   ========================================================================== */

function storageRemove(
    key
) {

    if (
        !runtime.storageAvailable
        ||
        !isString(key)
    ) {

        return false;

    }


    try {

        window.localStorage.removeItem(
            key
        );

        return true;

    } catch (error) {

        return false;

    }

}


/* ==========================================================================
   043 — EVENT BUS
   ========================================================================== */

var EventBus = {

    events:
        {},


    on:
        function (
            eventName,
            callback
        ) {

            if (
                !isString(eventName)
                ||
                !isFunction(callback)
            ) {

                return function () {};

            }


            if (
                !Array.isArray(
                    this.events[eventName]
                )
            ) {

                this.events[eventName] =
                    [];

            }


            this.events[eventName].push(
                callback
            );


            return function () {

                EventBus.off(
                    eventName,
                    callback
                );

            };

        },


    off:
        function (
            eventName,
            callback
        ) {

            var listeners =
                this.events[eventName];


            if (
                !Array.isArray(listeners)
            ) {

                return;

            }


            this.events[eventName] =
                listeners.filter(
                    function (
                        listener
                    ) {

                        return listener !==
                            callback;

                    }
                );

        },


    emit:
        function (
            eventName,
            payload
        ) {

            var listeners =
                this.events[eventName];


            if (
                !Array.isArray(listeners)
            ) {

                return;

            }


            listeners.slice().forEach(
                function (
                    listener
                ) {

                    try {

                        listener(
                            payload
                        );

                    } catch (error) {

                        console.error(
                            "[PathForage]",
                            error
                        );

                    }

                }
            );

        }

};


/* ==========================================================================
   044 — PUBLIC EVENT API
   ========================================================================== */

PathForage.events = {

    on:
        function (
            eventName,
            callback
        ) {

            return EventBus.on(
                eventName,
                callback
            );

        },


    off:
        function (
            eventName,
            callback
        ) {

            EventBus.off(
                eventName,
                callback
            );

        },


    emit:
        function (
            eventName,
            payload
        ) {

            EventBus.emit(
                eventName,
                payload
            );

        }

    };


/* ==========================================================================
   045 — APPLICATION LIFECYCLE
   ========================================================================== */

function markFoundationReady() {

    runtime.foundationReady =
        true;


    document.documentElement.dataset
        .pathforageFoundation =
            "ready";


    EventBus.emit(
        "foundation:ready",
        {
            timestamp:
                Date.now()
        }
    );

}


/* ==========================================================================
   046 — DOM READY HANDLER
   ========================================================================== */

function handleDOMReady() {

    if (
        runtime.domReady
    ) {

        return;

    }


    runtime.domReady =
        true;


    document.documentElement.dataset
        .pathforageDOM =
            "ready";


    markFoundationReady();

}


/* ==========================================================================
   047 — APPLICATION BOOTSTRAP
   ========================================================================== */

function bootstrap() {

    initializeFoundation();

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            handleDOMReady,
            {
                once:
                    true
            }
        );

    } else {

        handleDOMReady();

    }

}


/* ==========================================================================
   048 — GLOBAL ERROR SAFETY
   ========================================================================== */

window.addEventListener(
    "error",
    function (
        event
    ) {

        runtime.lastError =
            event.error ||
            new Error(
                event.message ||
                "Unknown PathForage error."
            );


        EventBus.emit(
            "runtime:error",
            {
                error:
                    runtime.lastError,
                event:
                    event
            }
        );

    }
);


/* ==========================================================================
   049 — UNHANDLED PROMISE SAFETY
   ========================================================================== */

window.addEventListener(
    "unhandledrejection",
    function (
        event
    ) {

        runtime.lastError =
            event.reason ||
            new Error(
                "Unhandled promise rejection."
            );


        EventBus.emit(
            "runtime:rejection",
            {
                reason:
                    event.reason,
                event:
                    event
            }
        );

    }
);


/* ==========================================================================
   050 — PUBLIC RUNTIME ACCESS
   ========================================================================== */

PathForage.runtime =
    runtime;


PathForage.getState =
    function () {

        return {

            initialized:
                runtime.initialized,

            domReady:
                runtime.domReady,

            foundationReady:
                runtime.foundationReady,

            online:
                runtime.online,

            storageAvailable:
                runtime.storageAvailable,

            analyticsAvailable:
                runtime.analyticsAvailable,

            adsenseAvailable:
                runtime.adsenseAvailable,

            lastError:
                runtime.lastError

        };

    };


/* ==========================================================================
   051 — INITIAL BOOTSTRAP
   ========================================================================== */

bootstrap();


/* ==========================================================================
   052 — END OF PART 5
   --------------------------------------------------------------------------
   PART 6 MUST CONTINUE DIRECTLY BELOW THIS LINE.

   DO NOT ADD:
   - </script>
   - <script>
   - HTML
   - CSS
   - closing document tags

   This remains one continuous standalone JavaScript file.
   ========================================================================== */
/* ==========================================================================
   053 — APPLICATION STATE STORE
   ========================================================================== */

var StateStore = (function () {

    var state = {

        initialized:
            false,

        activeView:
            "home",

        activeOpportunity:
            null,

        blueprint:
            [],

        savedOpportunities:
            [],

        recentSearches:
            [],

        filters:
            {},

        user:
            null

    };


    var subscribers =
        [];


    function clone(
        value
    ) {

        if (
            value ===
            undefined
        ) {

            return undefined;

        }


        try {

            return JSON.parse(
                JSON.stringify(value)
            );

        } catch (error) {

            return value;

        }

    }


    function get(
        key
    ) {

        if (
            !isString(key)
        ) {

            return undefined;

        }


        return clone(
            state[key]
        );

    }


    function getAll() {

        return clone(
            state
        );

    }


    function set(
        key,
        value
    ) {

        if (
            !isString(key)
        ) {

            return false;

        }


        var previous =
            clone(
                state[key]
            );


        state[key] =
            clone(value);


        notify(
            key,
            state[key],
            previous
        );


        return true;

    }


    function update(
        values
    ) {

        if (
            !isObject(values)
        ) {

            return false;

        }


        Object.keys(values).forEach(
            function (
                key
            ) {

                set(
                    key,
                    values[key]
                );

            }
        );


        return true;

    }


    function subscribe(
        callback
    ) {

        if (
            !isFunction(callback)
        ) {

            return function () {};

        }


        subscribers.push(
            callback
        );


        return function () {

            subscribers =
                subscribers.filter(
                    function (
                        subscriber
                    ) {

                        return subscriber !==
                            callback;

                    }
                );

        };

    }


    function notify(
        key,
        value,
        previous
    ) {

        var payload = {

            key:
                key,

            value:
                clone(value),

            previous:
                previous,

            state:
                getAll(),

            timestamp:
                Date.now()

        };


        subscribers
            .slice()
            .forEach(
                function (
                    subscriber
                ) {

                    try {

                        subscriber(
                            payload
                        );

                    } catch (error) {

                        console.error(
                            "[PathForage]",
                            error
                        );

                    }

                }
            );


        EventBus.emit(
            "state:change",
            payload
        );

    }


    return {

        get:
            get,

        getAll:
            getAll,

        set:
            set,

        update:
            update,

        subscribe:
            subscribe

    };

})();


/* ==========================================================================
   054 — PUBLIC STATE API
   ========================================================================== */

PathForage.state = {

    get:
        function (
            key
        ) {

            return StateStore.get(
                key
            );

        },


    getAll:
        function () {

            return StateStore.getAll();

        },


    set:
        function (
            key,
            value
        ) {

            return StateStore.set(
                key,
                value
            );

        },


    update:
        function (
            values
        ) {

            return StateStore.update(
                values
            );

        },


    subscribe:
        function (
            callback
        ) {

            return StateStore.subscribe(
                callback
            );

        }

};


/* ==========================================================================
   055 — PERSISTED APPLICATION STATE
   ========================================================================== */

var PERSISTED_STATE_KEY =
    "pathforage:state";


function loadPersistedState() {

    if (
        !runtime.storageAvailable
    ) {

        return;

    }


    var persisted =
        storageGet(
            PERSISTED_STATE_KEY,
            null
        );


    if (
        !isObject(persisted)
    ) {

        return;

    }


    StateStore.update(
        persisted
    );

}


/* ==========================================================================
   056 — SAVE APPLICATION STATE
   ========================================================================== */

function persistApplicationState() {

    if (
        !runtime.storageAvailable
    ) {

        return false;

    }


    var currentState =
        StateStore.getAll();


    return storageSet(
        PERSISTED_STATE_KEY,
        currentState
    );

}


/* ==========================================================================
   057 — STATE PERSISTENCE SUBSCRIBER
   ========================================================================== */

StateStore.subscribe(
    function () {

        persistApplicationState();

    }
);


/* ==========================================================================
   058 — OPPORTUNITY COLLECTION
   ========================================================================== */

var OpportunityStore = {

    getSaved:
        function () {

            return StateStore.get(
                "savedOpportunities"
            ) || [];

        },


    save:
        function (
            opportunity
        ) {

            if (
                !isObject(opportunity)
            ) {

                return false;

            }


            var current =
                this.getSaved();


            var id =
                opportunity.id ||
                opportunity.slug ||
                opportunity.url;


            if (
                !id
            ) {

                return false;

            }


            var exists =
                current.some(
                    function (
                        item
                    ) {

                        return (
                            item.id ===
                                id
                            ||
                            item.slug ===
                                id
                            ||
                            item.url ===
                                id
                        );

                    }
                );


            if (
                exists
            ) {

                return true;

            }


            current.push(
                opportunity
            );


            StateStore.set(
                "savedOpportunities",
                current
            );


            EventBus.emit(
                "opportunity:saved",
                {
                    opportunity:
                        opportunity
                }
            );


            return true;

        },


    remove:
        function (
            opportunityId
        ) {

            if (
                !isString(
                    opportunityId
                )
            ) {

                return false;

            }


            var current =
                this.getSaved();


            var updated =
                current.filter(
                    function (
                        item
                    ) {

                        return !(
                            item.id ===
                                opportunityId
                            ||
                            item.slug ===
                                opportunityId
                        );

                    }
                );


            StateStore.set(
                "savedOpportunities",
                updated
            );


            EventBus.emit(
                "opportunity:removed",
                {
                    id:
                        opportunityId
                }
            );


            return true;

        },


    has:
        function (
            opportunityId
        ) {

            if (
                !isString(
                    opportunityId
                )
            ) {

                return false;

            }


            return this
                .getSaved()
                .some(
                    function (
                        item
                    ) {

                        return (
                            item.id ===
                                opportunityId
                            ||
                            item.slug ===
                                opportunityId
                        );

                    }
                );

        }

};


/* ==========================================================================
   059 — PUBLIC OPPORTUNITY API
   ========================================================================== */

PathForage.opportunities = {

    getSaved:
        function () {

            return OpportunityStore.getSaved();

        },


    save:
        function (
            opportunity
        ) {

            return OpportunityStore.save(
                opportunity
            );

        },


    remove:
        function (
            opportunityId
        ) {

            return OpportunityStore.remove(
                opportunityId
            );

        },


    has:
        function (
            opportunityId
        ) {

            return OpportunityStore.has(
                opportunityId
            );

        }

};


/* ==========================================================================
   060 — BLUEPRINT STORE
   ========================================================================== */

var BlueprintStore = {

    get:
        function () {

            return StateStore.get(
                "blueprint"
            ) || [];

        },


    add:
        function (
            item
        ) {

            if (
                !isObject(item)
            ) {

                return false;

            }


            var current =
                this.get();


            var id =
                item.id ||
                item.slug;


            if (
                !id
            ) {

                return false;

            }


            if (
                current.some(
                    function (
                        existing
                    ) {

                        return (
                            existing.id ===
                                id
                            ||
                            existing.slug ===
                                id
                        );

                    }
                )
            ) {

                return true;

            }


            current.push(
                item
            );


            StateStore.set(
                "blueprint",
                current
            );


            EventBus.emit(
                "blueprint:add",
                {
                    item:
                        item
                }
            );


            return true;

        },


    remove:
        function (
            itemId
        ) {

            if (
                !isString(itemId)
            ) {

                return false;

            }


            var updated =
                this.get().filter(
                    function (
                        item
                    ) {

                        return !(
                            item.id ===
                                itemId
                            ||
                            item.slug ===
                                itemId
                        );

                    }
                );


            StateStore.set(
                "blueprint",
                updated
            );


            EventBus.emit(
                "blueprint:remove",
                {
                    id:
                        itemId
                }
            );


            return true;

        },


    clear:
        function () {

            StateStore.set(
                "blueprint",
                []
            );


            EventBus.emit(
                "blueprint:clear"
            );


            return true;

        }

};


/* ==========================================================================
   061 — PUBLIC BLUEPRINT API
   ========================================================================== */

PathForage.blueprint = {

    get:
        function () {

            return BlueprintStore.get();

        },


    add:
        function (
            item
        ) {

            return BlueprintStore.add(
                item
            );

        },


    remove:
        function (
            itemId
        ) {

            return BlueprintStore.remove(
                itemId
            );

        },


    clear:
        function () {

            return BlueprintStore.clear();

        }

};


/* ==========================================================================
   062 — SEARCH HISTORY
   ========================================================================== */

var SearchHistory = {

    get:
        function () {

            return StateStore.get(
                "recentSearches"
            ) || [];

        },


    add:
        function (
            query
        ) {

            query =
                normalizeText(
                    query
                );


            if (
                !query
            ) {

                return false;

            }


            var history =
                this.get().filter(
                    function (
                        item
                    ) {

                        return item !==
                            query;

                    }
                );


            history.unshift(
                query
            );


            history =
                history.slice(
                    0,
                    10
                );


            StateStore.set(
                "recentSearches",
                history
            );


            EventBus.emit(
                "search:history",
                {
                    query:
                        query,

                    history:
                        history
                }
            );


            return true;

        },


    clear:
        function () {

            StateStore.set(
                "recentSearches",
                []
            );


            EventBus.emit(
                "search:history:clear"
            );


            return true;

        }

};


/* ==========================================================================
   063 — PUBLIC SEARCH API
   ========================================================================== */

PathForage.searchHistory = {

    get:
        function () {

            return SearchHistory.get();

        },


    add:
        function (
            query
        ) {

            return SearchHistory.add(
                query
            );

        },


    clear:
        function () {

            return SearchHistory.clear();

        }

};


/* ==========================================================================
   064 — LOAD PERSISTED DATA
   ========================================================================== */

loadPersistedState();


/* ==========================================================================
   065 — STATE INITIALIZATION
   ========================================================================== */

StateStore.set(
    "initialized",
    true
);


/* ==========================================================================
   066 — END OF PART 6
   --------------------------------------------------------------------------
   PART 7 MUST CONTINUE DIRECTLY BELOW THIS LINE.

   DO NOT ADD:
   - </script>
   - <script>
   - HTML
   - CSS
   - closing document tags

   This remains one continuous standalone JavaScript file.
   ========================================================================== */
/* ==========================================================================
   067 — OPPORTUNITY NORMALIZATION
   ========================================================================== */

function normalizeOpportunity(
    opportunity
) {

    if (
        !isObject(opportunity)
    ) {

        return null;

    }


    var normalized = {

        id:
            normalizeText(
                opportunity.id ||
                opportunity.slug ||
                ""
            ),

        slug:
            normalizeText(
                opportunity.slug ||
                opportunity.id ||
                ""
            ),

        title:
            normalizeText(
                opportunity.title ||
                opportunity.name ||
                "Untitled Opportunity"
            ),

        organization:
            normalizeText(
                opportunity.organization ||
                opportunity.provider ||
                ""
            ),

        description:
            normalizeText(
                opportunity.description ||
                ""
            ),

        country:
            normalizeText(
                opportunity.country ||
                ""
            ),

        category:
            normalizeText(
                opportunity.category ||
                ""
            ),

        deadline:
            normalizeText(
                opportunity.deadline ||
                ""
            ),

        url:
            normalizeText(
                opportunity.url ||
                opportunity.link ||
                ""
            ),

        source:
            normalizeText(
                opportunity.source ||
                ""
            ),

        verified:
            opportunity.verified === true,

        tags:
            Array.isArray(
                opportunity.tags
            )
                ? opportunity.tags.slice()
                : []

    };


    return normalized;

}


/* ==========================================================================
   068 — OPPORTUNITY COLLECTION NORMALIZATION
   ========================================================================== */

function normalizeOpportunityCollection(
    opportunities
) {

    if (
        !Array.isArray(
            opportunities
        )
    ) {

        return [];

    }


    return opportunities
        .map(
            normalizeOpportunity
        )
        .filter(
            function (
                opportunity
            ) {

                return (
                    opportunity !==
                    null
                );

            }
        );

}


/* ==========================================================================
   069 — OPPORTUNITY REGISTRY
   ========================================================================== */

var OpportunityRegistry =
    (function () {

        var records = [];


        function replace(
            opportunities
        ) {

            records =
                normalizeOpportunityCollection(
                    opportunities
                );


            EventBus.emit(
                "opportunities:updated",
                {
                    count:
                        records.length,

                    opportunities:
                        records.slice()
                }
            );


            return records.slice();

        }


        function add(
            opportunity
        ) {

            var normalized =
                normalizeOpportunity(
                    opportunity
                );


            if (
                !normalized
                ||
                !normalized.id
            ) {

                return false;

            }


            var existingIndex =
                records.findIndex(
                    function (
                        item
                    ) {

                        return item.id ===
                            normalized.id;

                    }
                );


            if (
                existingIndex >=
                0
            ) {

                records[
                    existingIndex
                ] =
                    normalized;

            } else {

                records.push(
                    normalized
                );

            }


            EventBus.emit(
                "opportunity:registered",
                {
                    opportunity:
                        normalized
                }
            );


            return true;

        }


        function getAll() {

            return records.slice();

        }


        function getById(
            id
        ) {

            id =
                normalizeText(
                    id
                );


            return (
                records.find(
                    function (
                        item
                    ) {

                        return item.id ===
                            id;

                    }
                )
                ||
                null
            );

        }


        function clear() {

            records = [];


            EventBus.emit(
                "opportunities:cleared"
            );

        }


        return {

            replace:
                replace,

            add:
                add,

            getAll:
                getAll,

            getById:
                getById,

            clear:
                clear

        };

    })();


/* ==========================================================================
   070 — PUBLIC OPPORTUNITY REGISTRY
   ========================================================================== */

PathForage.opportunityRegistry = {

    replace:
        function (
            opportunities
        ) {

            return OpportunityRegistry.replace(
                opportunities
            );

        },


    add:
        function (
            opportunity
        ) {

            return OpportunityRegistry.add(
                opportunity
            );

        },


    getAll:
        function () {

            return OpportunityRegistry.getAll();

        },


    getById:
        function (
            id
        ) {

            return OpportunityRegistry.getById(
                id
            );

        },


    clear:
        function () {

            OpportunityRegistry.clear();

        }

};


/* ==========================================================================
   071 — FILTER NORMALIZATION
   ========================================================================== */

function normalizeFilters(
    filters
) {

    if (
        !isObject(filters)
    ) {

        return {};

    }


    var normalized = {};


    Object.keys(
        filters
    ).forEach(
        function (
            key
        ) {

            var value =
                filters[key];


            if (
                Array.isArray(value)
            ) {

                normalized[key] =
                    value
                        .map(
                            function (
                                item
                            ) {

                                return normalizeText(
                                    item
                                );

                            }
                        )
                        .filter(
                            Boolean
                        );

            } else if (
                typeof value ===
                "boolean"
            ) {

                normalized[key] =
                    value;

            } else if (
                value !==
                null
                &&
                value !==
                undefined
            ) {

                normalized[key] =
                    normalizeText(
                        value
                    );

            }

        }
    );


    return normalized;

}


/* ==========================================================================
   072 — OPPORTUNITY MATCHING
   ========================================================================== */

function opportunityMatchesFilters(
    opportunity,
    filters
) {

    if (
        !isObject(opportunity)
        ||
        !isObject(filters)
    ) {

        return true;

    }


    var normalized =
        normalizeFilters(
            filters
        );


    if (
        normalized.country
        &&
        normalizeText(
            opportunity.country
        ).toLowerCase() !==
        normalized.country.toLowerCase()
    ) {

        return false;

    }


    if (
        normalized.category
        &&
        normalizeText(
            opportunity.category
        ).toLowerCase() !==
        normalized.category.toLowerCase()
    ) {

        return false;

    }


    if (
        Array.isArray(
            normalized.categories
        )
        &&
        normalized.categories.length
    ) {

        var category =
            normalizeText(
                opportunity.category
            ).toLowerCase();


        var categoryMatch =
            normalized.categories.some(
                function (
                    item
                ) {

                    return (
                        item.toLowerCase() ===
                        category
                    );

                }
            );


        if (
            !categoryMatch
        ) {

            return false;

        }

    }


    if (
        Array.isArray(
            normalized.tags
        )
        &&
        normalized.tags.length
    ) {

        var opportunityTags =
            Array.isArray(
                opportunity.tags
            )
                ? opportunity.tags
                    .map(
                        function (
                            tag
                        ) {

                            return normalizeText(
                                tag
                            ).toLowerCase();

                        }
                    )
                : [];


        var hasTag =
            normalized.tags.some(
                function (
                    tag
                ) {

                    return opportunityTags
                        .indexOf(
                            tag.toLowerCase()
                        ) >= 0;

                }
            );


        if (
            !hasTag
        ) {

            return false;

        }

    }


    if (
        normalized.verified ===
        true
        &&
        opportunity.verified !==
        true
    ) {

        return false;

    }


    return true;

}


/* ==========================================================================
   073 — OPPORTUNITY SEARCH
   ========================================================================== */

function searchOpportunities(
    query,
    options
) {

    query =
        normalizeText(
            query
        );


    options =
        isObject(options)
            ? options
            : {};


    var filters =
        normalizeFilters(
            options.filters ||
            {}
        );


    var source =
        OpportunityRegistry.getAll();


    if (
        !source.length
    ) {

        source =
            normalizeOpportunityCollection(
                options.data ||
                []
            );

    }


    var normalizedQuery =
        query.toLowerCase();


    var results =
        source.filter(
            function (
                opportunity
            ) {

                if (
                    !opportunityMatchesFilters(
                        opportunity,
                        filters
                    )
                ) {

                    return false;

                }


                if (
                    !normalizedQuery
                ) {

                    return true;

                }


                var searchableText = [

                    opportunity.title,

                    opportunity.organization,

                    opportunity.description,

                    opportunity.country,

                    opportunity.category,

                    opportunity.source,

                    opportunity.tags.join(
                        " "
                    )

                ]
                    .join(
                        " "
                    )
                    .toLowerCase();


                return searchableText
                    .indexOf(
                        normalizedQuery
                    ) >= 0;

            }
        );


    return results;

}


/* ==========================================================================
   074 — PUBLIC SEARCH ENGINE
   ========================================================================== */

PathForage.search = {

    opportunities:
        function (
            query,
            options
        ) {

            var results =
                searchOpportunities(
                    query,
                    options
                );


            SearchHistory.add(
                query
            );


            EventBus.emit(
                "search:completed",
                {
                    query:
                        normalizeText(
                            query
                        ),

                    results:
                        results,

                    count:
                        results.length
                }
            );


            return results;

        }

};


/* ==========================================================================
   075 — ACTIVE FILTER STATE
   ========================================================================== */

function setActiveFilters(
    filters
) {

    var normalized =
        normalizeFilters(
            filters
        );


    StateStore.set(
        "filters",
        normalized
    );


    EventBus.emit(
        "filters:updated",
        {
            filters:
                normalized
        }
    );


    return normalized;

}


/* ==========================================================================
   076 — PUBLIC FILTER API
   ========================================================================== */

PathForage.filters = {

    get:
        function () {

            return StateStore.get(
                "filters"
            ) || {};

        },


    set:
        function (
            filters
        ) {

            return setActiveFilters(
                filters
            );

        },


    clear:
        function () {

            return setActiveFilters(
                {}
            );

        }

};


/* ==========================================================================
   077 — ACTIVE VIEW MANAGEMENT
   ========================================================================== */

function setActiveView(
    view
) {

    view =
        normalizeText(
            view
        );


    if (
        !view
    ) {

        return false;

    }


    var previous =
        StateStore.get(
            "activeView"
        );


    if (
        previous ===
        view
    ) {

        return true;

    }


    StateStore.set(
        "activeView",
        view
    );


    document.documentElement.dataset
        .pathforageView =
            view;


    EventBus.emit(
        "view:change",
        {
            view:
                view,

            previous:
                previous
        }
    );


    return true;

}


/* ==========================================================================
   078 — PUBLIC VIEW API
   ========================================================================== */

PathForage.view = {

    get:
        function () {

            return StateStore.get(
                "activeView"
            );

        },


    set:
        function (
            view
        ) {

            return setActiveView(
                view
            );

        }

};
   079 — SELECTED OPPORTUNITY
   ========================================================================== */

function selectOpportunity(
    opportunity
) {

    var normalized =
        normalizeOpportunity(
            opportunity
        );


    if (
        !normalized
    ) {

        StateStore.set(
            "activeOpportunity",
            null
        );


        return null;

    }


    StateStore.set(
        "activeOpportunity",
        normalized
    );


    EventBus.emit(
        "opportunity:selected",
        {
            opportunity:
                normalized
        }
    );


    return normalized;

}


/* ==========================================================================
   080 — PUBLIC SELECTION API
   ========================================================================== */

PathForage.selection = {

    get:
        function () {

            return StateStore.get(
                "activeOpportunity"
            );

        },


    set:
        function (
            opportunity
        ) {

            return selectOpportunity(
                opportunity
            );

        },


    clear:
        function () {

            return selectOpportunity(
                null
            );

        }

};


/* ==========================================================================
   081 — END OF PART 7
   --------------------------------------------------------------------------
   PART 8 MUST CONTINUE DIRECTLY BELOW THIS LINE.

   DO NOT ADD:
   - </script>
   - <script>
   - HTML
   - CSS
   - closing document tags

   This remains one continuous standalone JavaScript file.
   ========================================================================== */



/* ==========================================================================
/* ==========================================================================
   082 — OPPORTUNITY COLLECTION
   --------------------------------------------------------------------------
   PathForage opportunity collection management.
   ========================================================================== */

var OpportunityStore = {

    items:
        [],


    set:
        function (
            opportunities
        ) {

            if (
                !Array.isArray(
                    opportunities
                )
            ) {

                opportunities =
                    [];

            }


            this.items =
                opportunities
                    .map(
                        normalizeOpportunity
                    )
                    .filter(
                        Boolean
                    );


            EventBus.emit(
                "opportunities:updated",
                {
                    opportunities:
                        this.get()
                }
            );


            return this.get();

        },


    add:
        function (
            opportunity
        ) {

            var normalized =
                normalizeOpportunity(
                    opportunity
                );


            if (
                !normalized
            ) {

                return null;

            }


            this.items.push(
                normalized
            );


            EventBus.emit(
                "opportunity:added",
                {
                    opportunity:
                        normalized
                }
            );


            return normalized;

        },


    remove:
        function (
            opportunityId
        ) {

            var index =
                this.items.findIndex(
                    function (
                        item
                    ) {

                        return String(
                            item.id
                        ) === String(
                            opportunityId
                        );

                    }
                );


            if (
                index === -1
            ) {

                return false;

            }


            var removed =
                this.items.splice(
                    index,
                    1
                )[0];


            EventBus.emit(
                "opportunity:removed",
                {
                    opportunity:
                        removed
                }
            );


            return true;

        },


    get:
        function () {

            return this.items.slice();

        },


    getById:
        function (
            opportunityId
        ) {

            return (
                this.items.find(
                    function (
                        item
                    ) {

                        return String(
                            item.id
                        ) === String(
                            opportunityId
                        );

                    }
                ) ||
                null
            );

        },


    clear:
        function () {

            this.items =
                [];


            EventBus.emit(
                "opportunities:cleared"
            );


            return true;

        }

};


/* ==========================================================================
   083 — PUBLIC OPPORTUNITY API
   ========================================================================== */

PathForage.opportunities = {

    get:
        function () {

            return OpportunityStore.get();

        },


    getById:
        function (
            id
        ) {

            return OpportunityStore.getById(
                id
            );

        },


    set:
        function (
            opportunities
        ) {

            return OpportunityStore.set(
                opportunities
            );

        },


    add:
        function (
            opportunity
        ) {

            return OpportunityStore.add(
                opportunity
            );

        },


    remove:
        function (
            id
        ) {

            return OpportunityStore.remove(
                id
            );

        },


    clear:
        function () {

            return OpportunityStore.clear();

        }

};


/* ==========================================================================
   084 — OPPORTUNITY FILTER STATE
   ========================================================================== */

var OpportunityFilters = {

    query:
        "",


    category:
        "all",


    country:
        "all",


    educationLevel:
        "all",


    funding:
        "all",


    mode:
        "all",


    deadline:
        "all",


    sort:
        "relevance"

};


/* ==========================================================================
   085 — FILTER NORMALIZATION
   ========================================================================== */

function normalizeOpportunityFilters(
    filters
) {

    var source =
        isObject(
            filters
        )
            ? filters
            : {};


    return {

        query:
            normalizeText(
                source.query ||
                ""
            ),


        category:
            source.category ||
            "all",


        country:
            source.country ||
            "all",


        educationLevel:
            source.educationLevel ||
            "all",


        funding:
            source.funding ||
            "all",


        mode:
            source.mode ||
            "all",


        deadline:
            source.deadline ||
            "all",


        sort:
            source.sort ||
            "relevance"

    };

}


/* ==========================================================================
   086 — FILTER STATE UPDATE
   ========================================================================== */

function setOpportunityFilters(
    filters
) {

    var normalized =
        normalizeOpportunityFilters(
            Object.assign(
                {},
                OpportunityFilters,
                filters || {}
            )
        );


    OpportunityFilters =
        normalized;


    StateStore.set(
        "opportunityFilters",
        Object.assign(
            {},
            normalized
        )
    );


    EventBus.emit(
        "opportunities:filtersChanged",
        {
            filters:
                Object.assign(
                    {},
                    normalized
                )
        }
    );


    return Object.assign(
        {},
        normalized
    );

}


/* ==========================================================================
   087 — FILTER MATCH HELPERS
   ========================================================================== */

function matchesOpportunityQuery(
    opportunity,
    query
) {

    if (
        !query
    ) {

        return true;

    }


    var haystack =
        normalizeText(
            [
                opportunity.title,
                opportunity.name,
                opportunity.organization,
                opportunity.provider,
                opportunity.description,
                opportunity.category,
                opportunity.country,
                opportunity.location,
                opportunity.tags
            ]
                .flat()
                .join(
                    " "
                )
        );


    return haystack.indexOf(
        normalizeText(
            query
        )
    ) !== -1;

}


function matchesFilterValue(
    value,
    filter
) {

    if (
        !filter ||
        filter === "all"
    ) {

        return true;

    }


    if (
        Array.isArray(
            value
        )
    ) {

        return value.some(
            function (
                item
            ) {

                return normalizeText(
                    item
                ) === normalizeText(
                    filter
                );

            }
        );

    }


    return normalizeText(
        value
    ) === normalizeText(
        filter
    );

}


/* ==========================================================================
   088 — DEADLINE FILTER
   ========================================================================== */

function matchesDeadlineFilter(
    opportunity,
    filter
) {

    if (
        !filter ||
        filter === "all"
    ) {

        return true;

    }


    if (
        !opportunity.deadline
    ) {

        return false;

    }


    var deadline =
        new Date(
            opportunity.deadline
        );


    if (
        Number.isNaN(
            deadline.getTime()
        )
    ) {

        return false;

    }


    var now =
        new Date();


    var difference =
        deadline.getTime() -
        now.getTime();


    var day =
        86400000;


    if (
        filter === "today"
    ) {

        return (
            deadline.toDateString() ===
            now.toDateString()
        );

    }


    if (
        filter === "7-days"
    ) {

        return (
            difference >= 0 &&
            difference <=
                7 * day
        );

    }


    if (
        filter === "30-days"
    ) {

        return (
            difference >= 0 &&
            difference <=
                30 * day
        );

    }


    if (
        filter === "90-days"
    ) {

        return (
            difference >= 0 &&
            difference <=
                90 * day
        );

    }


    return true;

}


/* ==========================================================================
   089 — OPPORTUNITY MATCHING
   ========================================================================== */

function matchesOpportunity(
    opportunity,
    filters
) {

    if (
        !opportunity
    ) {

        return false;

    }


    var active =
        normalizeOpportunityFilters(
            filters
        );


    if (
        !matchesOpportunityQuery(
            opportunity,
            active.query
        )
    ) {

        return false;

    }


    if (
        !matchesFilterValue(
            opportunity.category,
            active.category
        )
    ) {

        return false;

    }


    if (
        !matchesFilterValue(
            opportunity.country,
            active.country
        )
    ) {

        return false;

    }


    if (
        !matchesFilterValue(
            opportunity.educationLevel,
            active.educationLevel
        )
    ) {

        return false;

    }


    if (
        !matchesFilterValue(
            opportunity.funding,
            active.funding
        )
    ) {

        return false;

    }


    if (
        !matchesFilterValue(
            opportunity.mode,
            active.mode
        )
    ) {

        return false;

    }


    if (
        !matchesDeadlineFilter(
            opportunity,
            active.deadline
        )
    ) {

        return false;

    }


    return true;

}


/* ==========================================================================
   090 — OPPORTUNITY SORTING
   ========================================================================== */

function getOpportunityTimestamp(
    opportunity
) {

    var date =
        new Date(
            opportunity.deadline
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return Number.MAX_SAFE_INTEGER;

    }


    return date.getTime();

}


function calculateOpportunityRelevance(
    opportunity,
    query
) {

    var score =
        Number(
            opportunity.relevanceScore
        );


    if (
        !Number.isFinite(
            score
        )
    ) {

        score =
            0;

    }


    if (
        query
    ) {

        var normalizedQuery =
            normalizeText(
                query
            );


        var title =
            normalizeText(
                opportunity.title ||
                opportunity.name ||
                ""
            );


        var organization =
            normalizeText(
                opportunity.organization ||
                opportunity.provider ||
                ""
            );


        if (
            title.indexOf(
                normalizedQuery
            ) !== -1
        ) {

            score +=
                100;

        }


        if (
            organization.indexOf(
                normalizedQuery
            ) !== -1
        ) {

            score +=
                40;

        }

    }


    return score;

}


function sortOpportunities(
    opportunities,
    sort,
    query
) {

    var result =
        opportunities.slice();


    if (
        sort === "deadline"
    ) {

        return result.sort(
            function (
                a,
                b
            ) {

                return (
                    getOpportunityTimestamp(
                        a
                    ) -
                    getOpportunityTimestamp(
                        b
                    )
                );

            }
        );

    }


    if (
        sort === "newest"
    ) {

        return result.sort(
            function (
                a,
                b
            ) {

                var aDate =
                    new Date(
                        a.publishedAt ||
                        a.createdAt ||
                        0
                    ).getTime();


                var bDate =
                    new Date(
                        b.publishedAt ||
                        b.createdAt ||
                        0
                    ).getTime();


                return (
                    bDate -
                    aDate
                );

            }
        );

    }


    if (
        sort === "funding"
    ) {

        return result.sort(
            function (
                a,
                b
            ) {

                return (
                    Number(
                        b.fundingAmount ||
                        0
                    ) -
                    Number(
                        a.fundingAmount ||
                        0
                    )
                );

            }
        );

    }


    return result.sort(
        function (
            a,
            b
        ) {

            return (
                calculateOpportunityRelevance(
                    b,
                    query
                ) -
                calculateOpportunityRelevance(
                    a,
                    query
                )
            );

        }
    );

}


/* ==========================================================================
   091 — FILTERED OPPORTUNITY QUERY
   ========================================================================== */

function getFilteredOpportunities(
    filters
) {

    var active =
        normalizeOpportunityFilters(
            filters ||
            OpportunityFilters
        );


    var opportunities =
        OpportunityStore.get()
            .filter(
                function (
                    opportunity
                ) {

                    return matchesOpportunity(
                        opportunity,
                        active
                    );

                }
            );


    return sortOpportunities(
        opportunities,
        active.sort,
        active.query
    );

}


/* ==========================================================================
   092 — PUBLIC FILTER API
   ========================================================================== */

PathForage.filters = {

    get:
        function () {

            return Object.assign(
                {},
                OpportunityFilters
            );

        },


    set:
        function (
            filters
        ) {

            return setOpportunityFilters(
                filters
            );

        },


    reset:
        function () {

            return setOpportunityFilters(
                {
                    query:
                        "",

                    category:
                        "all",

                    country:
                        "all",

                    educationLevel:
                        "all",

                    funding:
                        "all",

                    mode:
                        "all",

                    deadline:
                        "all",

                    sort:
                        "relevance"

                }
            );

        },


    apply:
        function () {

            var results =
                getFilteredOpportunities(
                    OpportunityFilters
                );


            EventBus.emit(
                "opportunities:filtered",
                {
                    opportunities:
                        results,

                    filters:
                        Object.assign(
                            {},
                            OpportunityFilters
                        )
                }
            );


            return results;

        }

};


/* ==========================================================================
   093 — OPPORTUNITY SEARCH API
   ========================================================================== */

PathForage.search = {

    query:
        function (
            query
        ) {

            setOpportunityFilters(
                {
                    query:
                        query || ""
                }
            );


            return getFilteredOpportunities(
                OpportunityFilters
            );

        },


    clear:
        function () {

            setOpportunityFilters(
                {
                    query:
                        ""
                }
            );


            return getFilteredOpportunities(
                OpportunityFilters
            );

        }

};


/* ==========================================================================
   094 — SEARCH STATE SYNCHRONIZATION
   ========================================================================== */

function synchronizeSearchState() {

    StateStore.set(
        "searchQuery",
        OpportunityFilters.query
    );


    EventBus.emit(
        "search:changed",
        {
            query:
                OpportunityFilters.query
        }
    );

}


/* ==========================================================================
   095 — OPPORTUNITY RESULT STATE
   ========================================================================== */

function updateOpportunityResults() {

    var results =
        getFilteredOpportunities(
            OpportunityFilters
        );


    StateStore.set(
        "opportunityResults",
        results
    );


    StateStore.set(
        "opportunityResultCount",
        results.length
    );


    synchronizeSearchState();


    EventBus.emit(
        "opportunities:resultsUpdated",
        {
            opportunities:
                results,

            count:
                results.length
        }
    );


    return results;

}


/* ==========================================================================
   096 — FILTER EVENT BINDING
   ========================================================================== */

function initializeOpportunityFiltering() {

    EventBus.on(
        "opportunities:filtersChanged",
        function () {

            updateOpportunityResults();

        }
    );


    EventBus.on(
        "opportunities:updated",
        function () {

            updateOpportunityResults();

        }
    );


    EventBus.on(
        "opportunity:added",
        function () {

            updateOpportunityResults();

        }
    );


    EventBus.on(
        "opportunity:removed",
        function () {

            updateOpportunityResults();

        }
    );


    EventBus.on(
        "opportunities:cleared",
        function () {

            updateOpportunityResults();

        }
    );

}


/* ==========================================================================
   097 — OPPORTUNITY BOOKMARK STORE
   ========================================================================== */

var BookmarkStore = {

    key:
        "pathforage.bookmarks",


    items:
        [],


    initialize:
        function () {

            var saved =
                storageGet(
                    this.key
                );


            if (
                Array.isArray(
                    saved
                )
            ) {

                this.items =
                    saved.map(
                        String
                    );

            }


            return this.items.slice();

        },


    persist:
        function () {

            storageSet(
                this.key,
                this.items
            );


            return true;

        },


    has:
        function (
            id
        ) {

            return this.items.indexOf(
                String(
                    id
                )
            ) !== -1;

        },


    add:
        function (
            id
        ) {

            var normalizedId =
                String(
                    id
                );


            if (
                !normalizedId ||
                this.has(
                    normalizedId
                )
            ) {

                return false;

            }


            this.items.push(
                normalizedId
            );


            this.persist();


            EventBus.emit(
                "bookmark:added",
                {
                    opportunityId:
                        normalizedId
                }
            );


            return true;

        },


    remove:
        function (
            id
        ) {

            var normalizedId =
                String(
                    id
                );


            var index =
                this.items.indexOf(
                    normalizedId
                );


            if (
                index === -1
            ) {

                return false;

            }


            this.items.splice(
                index,
                1
            );


            this.persist();


            EventBus.emit(
                "bookmark:removed",
                {
                    opportunityId:
                        normalizedId
                }
            );


            return true;

        },


    toggle:
        function (
            id
        ) {

            if (
                this.has(
                    id
                )
            ) {

                this.remove(
                    id
                );


                return false;

            }


            this.add(
                id
            );


            return true;

        },


    get:
        function () {

            return this.items.slice();

        },


    clear:
        function () {

            this.items =
                [];


            this.persist();


            EventBus.emit(
                "bookmarks:cleared"
            );


            return true;

        }

};


/* ==========================================================================
   098 — PUBLIC BOOKMARK API
   ========================================================================== */

PathForage.bookmarks = {

    get:
        function () {

            return BookmarkStore.get();

        },


    has:
        function (
            id
        ) {

            return BookmarkStore.has(
                id
            );

        },


    add:
        function (
            id
        ) {

            return BookmarkStore.add(
                id
            );

        },


    remove:
        function (
            id
        ) {

            return BookmarkStore.remove(
                id
            );

        },


    toggle:
        function (
            id
        ) {

            return BookmarkStore.toggle(
                id
            );

        },


    clear:
        function () {

            return BookmarkStore.clear();

        }

};


/* ==========================================================================
   099 — BOOKMARKED OPPORTUNITIES
   ========================================================================== */

function getBookmarkedOpportunities() {

    return BookmarkStore
        .get()
        .map(
            function (
                id
            ) {

                return OpportunityStore.getById(
                    id
                );

            }
        )
        .filter(
            Boolean
        );

}


/* ==========================================================================
   100 — PUBLIC BOOKMARKED OPPORTUNITY API
   ========================================================================== */

PathForage.bookmarks.listOpportunities =
    function () {

        return getBookmarkedOpportunities();

    };


/* ==========================================================================
   101 — BOOKMARK INITIALIZATION
   ========================================================================== */

function initializeBookmarks() {

    BookmarkStore.initialize();


    EventBus.on(
        "bookmark:added",
        function (
            payload
        ) {

            EventBus.emit(
                "opportunity:bookmarkChanged",
                payload
            );

        }
    );


    EventBus.on(
        "bookmark:removed",
        function (
            payload
        ) {

            EventBus.emit(
                "opportunity:bookmarkChanged",
                payload
            );

        }
    );

}


/* ==========================================================================
   102 — BLUEPRINT ITEM STORE
   ========================================================================== */

var BlueprintStore = {

    key:
        "pathforage.blueprint",


    items:
        [],


    initialize:
        function () {

            var saved =
                storageGet(
                    this.key
                );


            if (
                Array.isArray(
                    saved
                )
            ) {

                this.items =
                    saved
                        .map(
                            normalizeBlueprintItem
                        )
                        .filter(
                            Boolean
                        );

            }


            return this.get();

        },


    persist:
        function () {

            storageSet(
                this.key,
                this.items
            );


            return true;

        },


    get:
        function () {

            return this.items.slice();

        },


    find:
        function (
            id
        ) {

            return (
                this.items.find(
                    function (
                        item
                    ) {

                        return String(
                            item.id
                        ) === String(
                            id
                        );

                    }
                ) ||
                null
            );

        },


    add:
        function (
            item
        ) {

            var normalized =
                normalizeBlueprintItem(
                    item
                );


            if (
                !normalized
            ) {

                return null;

            }


            var existing =
                this.find(
                    normalized.id
                );


            if (
                existing
            ) {

                return existing;

            }


            this.items.push(
                normalized
            );


            this.persist();


            EventBus.emit(
                "blueprint:itemAdded",
                {
                    item:
                        normalized
                }
            );


            return normalized;

        },


    remove:
        function (
            id
        ) {

            var index =
                this.items.findIndex(
                    function (
                        item
                    ) {

                        return String(
                            item.id
                        ) === String(
                            id
                        );

                    }
                );


            if (
                index === -1
            ) {

                return false;

            }


            var removed =
                this.items.splice(
                    index,
                    1
                )[0];


            this.persist();


            EventBus.emit(
                "blueprint:itemRemoved",
                {
                    item:
                        removed
                }
            );


            return true;

        },


    update:
        function (
            id,
            changes
        ) {

            var item =
                this.find(
                    id
                );


            if (
                !item ||
                !isObject(
                    changes
                )
            ) {

                return null;

            }


            Object.keys(
                changes
            ).forEach(
                function (
                    key
                ) {

                    if (
                        key !== "id"
                    ) {

                        item[key] =
                            changes[key];

                    }

                }
            );


            item.updatedAt =
                new Date()
                    .toISOString();


            this.persist();


            EventBus.emit(
                "blueprint:itemUpdated",
                {
                    item:
                        item
                }
            );


            return item;

        },


    clear:
        function () {

            this.items =
                [];


            this.persist();


            EventBus.emit(
                "blueprint:cleared"
            );


            return true;

        }

};


/* ==========================================================================
   103 — BLUEPRINT ITEM NORMALIZATION
   ========================================================================== */

function normalizeBlueprintItem(
    item
) {

    if (
        !isObject(
            item
        )
    ) {

        return null;

    }


    var opportunityId =
        item.opportunityId ||
        item.sourceOpportunityId ||
        item.id;


    if (
        opportunityId === undefined ||
        opportunityId === null
    ) {

        return null;

    }


    return {

        id:
            String(
                item.id ||
                opportunityId
            ),


        opportunityId:
            String(
                opportunityId
            ),


        title:
            normalizeText(
                item.title ||
                item.name ||
                "Opportunity"
            ),


        status:
            item.status ||
            "planned",


        priority:
            item.priority ||
            "normal",


        deadline:
            item.deadline ||
            null,


        notes:
            item.notes ||
            "",


        createdAt:
            item.createdAt ||
            new Date()
                .toISOString(),


        updatedAt:
            item.updatedAt ||
            new Date()
                .toISOString()

    };

}


/* ==========================================================================
   104 — PUBLIC BLUEPRINT API
   ========================================================================== */

PathForage.blueprint = {

    get:
        function () {

            return BlueprintStore.get();

        },


    find:
        function (
            id
        ) {

            return BlueprintStore.find(
                id
            );

        },


    add:
        function (
            item
        ) {

            return BlueprintStore.add(
                item
            );

        },


    remove:
        function (
            id
        ) {

            return BlueprintStore.remove(
                id
            );

        },


    update:
        function (
            id,
            changes
        ) {

            return BlueprintStore.update(
                id,
                changes
            );

        },


    clear:
        function () {

            return BlueprintStore.clear();

        },


    count:
        function () {

            return BlueprintStore.get()
                .length;

        }

};


/* ==========================================================================
   105 — ADD SELECTED OPPORTUNITY TO BLUEPRINT
   ========================================================================== */

function addSelectedOpportunityToBlueprint() {

    var opportunity =
        PathForage.selection.get();


    if (
        !opportunity
    ) {

        return null;

    }


    var item =
        BlueprintStore.add(
            {
                opportunityId:
                    opportunity.id,

                title:
                    opportunity.title ||
                    opportunity.name,

                deadline:
                    opportunity.deadline,

                status:
                    "planned",

                priority:
                    "normal"

            }
        );


    if (
        item
    ) {

        EventBus.emit(
            "opportunity:addedToBlueprint",
            {
                opportunity:
                    opportunity,

                item:
                    item
            }
        );

    }


    return item;

}


/* ==========================================================================
   106 — PUBLIC BLUEPRINT ACTION
   ========================================================================== */

PathForage.blueprint.addSelected =
    function () {

        return addSelectedOpportunityToBlueprint();

    };


/* ==========================================================================
   107 — BLUEPRINT DERIVED METRICS
   ========================================================================== */

function calculateBlueprintMetrics() {

    var items =
        BlueprintStore.get();


    var completed =
        items.filter(
            function (
                item
            ) {

                return item.status ===
                    "completed";

            }
        ).length;


    var active =
        items.filter(
            function (
                item
            ) {

                return (
                    item.status !==
                        "completed" &&
                    item.status !==
                        "cancelled"
                );

            }
        ).length;


    var overdue =
        items.filter(
            function (
                item
            ) {

                if (
                    !item.deadline
                ) {

                    return false;

                }


                var deadline =
                    new Date(
                        item.deadline
                    );


                return (
                    !Number.isNaN(
                        deadline.getTime()
                    ) &&
                    deadline.getTime() <
                        Date.now() &&
                    item.status !==
                        "completed"
                );

            }
        ).length;


    return {

        total:
            items.length,

        active:
            active,

        completed:
            completed,

        overdue:
            overdue

    };

}


/* ==========================================================================
   108 — PUBLIC BLUEPRINT METRICS
   ========================================================================== */

PathForage.blueprint.metrics =
    function () {

        return calculateBlueprintMetrics();

    };


/* ==========================================================================
   109 — BLUEPRINT STATE SYNCHRONIZATION
   ========================================================================== */

function synchronizeBlueprintState() {

    var items =
        BlueprintStore.get();


    StateStore.set(
        "blueprintItems",
        items
    );


    StateStore.set(
        "blueprintMetrics",
        calculateBlueprintMetrics()
    );


    EventBus.emit(
        "blueprint:stateUpdated",
        {
            items:
                items,

            metrics:
                calculateBlueprintMetrics()
        }
    );

}


/* ==========================================================================
   110 — BLUEPRINT EVENT BINDING
   ========================================================================== */

function initializeBlueprint() {

    BlueprintStore.initialize();


    EventBus.on(
        "blueprint:itemAdded",
        synchronizeBlueprintState
    );


    EventBus.on(
        "blueprint:itemRemoved",
        synchronizeBlueprintState
    );


    EventBus.on(
        "blueprint:itemUpdated",
        synchronizeBlueprintState
    );


    EventBus.on(
        "blueprint:cleared",
        synchronizeBlueprintState
    );


    synchronizeBlueprintState();

}


/* ==========================================================================
   111 — END OF PART 8
   --------------------------------------------------------------------------
   PART 9 MUST CONTINUE DIRECTLY BELOW THIS LINE.

   DO NOT ADD:
   - </script>
   - <script>
   - HTML
   - CSS
   - closing document tags

   This remains one continuous standalone JavaScript file.
   ========================================================================== */
/* ==========================================================================
   082 — OPPORTUNITY COLLECTION STORE
   --------------------------------------------------------------------------
   Maintains the normalized opportunity collection used by the application.
   ========================================================================== */

var OpportunityStore = {

    items:
        [],


    set:
        function (
            opportunities
        ) {

            if (
                !Array.isArray(
                    opportunities
                )
            ) {

                opportunities =
                    [];

            }


            this.items =
                opportunities
                    .map(
                        normalizeOpportunity
                    )
                    .filter(
                        function (
                            opportunity
                        ) {

                            return Boolean(
                                opportunity
                            );

                        }
                    );


            StateStore.set(
                "opportunities",
                this.items.slice()
            );


            EventBus.emit(
                "opportunities:updated",
                {
                    opportunities:
                        this.items.slice()
                }
            );


            return this.items.slice();

        },


    add:
        function (
            opportunity
        ) {

            var normalized =
                normalizeOpportunity(
                    opportunity
                );


            if (
                !normalized
            ) {

                return null;

            }


            var existingIndex =
                this.items.findIndex(
                    function (
                        item
                    ) {

                        return (
                            item.id ===
                            normalized.id
                        );

                    }
                );


            if (
                existingIndex >=
                0
            ) {

                this.items[
                    existingIndex
                ] =
                    normalized;

            } else {

                this.items.push(
                    normalized
                );

            }


            StateStore.set(
                "opportunities",
                this.items.slice()
            );


            EventBus.emit(
                "opportunity:added",
                {
                    opportunity:
                        normalized
                }
            );


            return normalized;

        },


    remove:
        function (
            opportunityId
        ) {

            var id =
                normalizeText(
                    opportunityId
                );


            if (
                !id
            ) {

                return false;

            }


            var originalLength =
                this.items.length;


            this.items =
                this.items.filter(
                    function (
                        opportunity
                    ) {

                        return (
                            opportunity.id !==
                            id
                        );

                    }
                );


            if (
                this.items.length ===
                originalLength
            ) {

                return false;

            }


            StateStore.set(
                "opportunities",
                this.items.slice()
            );


            EventBus.emit(
                "opportunity:removed",
                {
                    opportunityId:
                        id
                }
            );


            return true;

        },


    get:
        function () {

            return this.items.slice();

        },


    find:
        function (
            opportunityId
        ) {

            var id =
                normalizeText(
                    opportunityId
                );


            if (
                !id
            ) {

                return null;

            }


            return (
                this.items.find(
                    function (
                        opportunity
                    ) {

                        return (
                            opportunity.id ===
                            id
                        );

                    }
                ) ||
                null
            );

        },


    clear:
        function () {

            this.items =
                [];


            StateStore.set(
                "opportunities",
                []
            );


            EventBus.emit(
                "opportunities:cleared"
            );


            return true;

        }

};


/* ==========================================================================
   083 — PUBLIC OPPORTUNITY API
   ========================================================================== */

PathForage.opportunities = {

    get:
        function () {

            return OpportunityStore.get();

        },


    find:
        function (
            opportunityId
        ) {

            return OpportunityStore.find(
                opportunityId
            );

        },


    set:
        function (
            opportunities
        ) {

            return OpportunityStore.set(
                opportunities
            );

        },


    add:
        function (
            opportunity
        ) {

            return OpportunityStore.add(
                opportunity
            );

        },


    remove:
        function (
            opportunityId
        ) {

            return OpportunityStore.remove(
                opportunityId
            );

        },


    clear:
        function () {

            return OpportunityStore.clear();

        }

};


/* ==========================================================================
   084 — FILTER STATE
   ========================================================================== */

var FilterStore = {

    defaults:
        {

            query:
                "",

            category:
                "all",

            country:
                "all",

            funding:
                "all",

            educationLevel:
                "all",

            deadline:
                "all",

            sort:
                "relevance"

        },


    get:
        function () {

            var stored =
                StateStore.get(
                    "filters"
                );


            if (
                !isObject(
                    stored
                )
            ) {

                return Object.assign(
                    {},
                    this.defaults
                );

            }


            return Object.assign(
                {},
                this.defaults,
                stored
            );

        },


    set:
        function (
            filters
        ) {

            if (
                !isObject(
                    filters
                )
            ) {

                filters =
                    {};

            }


            var next =
                Object.assign(
                    {},
                    this.defaults,
                    this.get(),
                    filters
                );


            StateStore.set(
                "filters",
                next
            );


            EventBus.emit(
                "filters:changed",
                {
                    filters:
                        next
                }
            );


            return next;

        },


    reset:
        function () {

            var defaults =
                Object.assign(
                    {},
                    this.defaults
                );


            StateStore.set(
                "filters",
                defaults
            );


            EventBus.emit(
                "filters:reset",
                {
                    filters:
                        defaults
                }
            );


            return defaults;

        }

};


/* ==========================================================================
   085 — PUBLIC FILTER API
   ========================================================================== */

PathForage.filters = {

    get:
        function () {

            return FilterStore.get();

        },


    set:
        function (
            filters
        ) {

            return FilterStore.set(
                filters
            );

        },


    reset:
        function () {

            return FilterStore.reset();

        }

};


/* ==========================================================================
   086 — OPPORTUNITY SEARCH NORMALIZATION
   ========================================================================== */

function normalizeSearchQuery(
    query
) {

    return normalizeText(
        query
    )
        .toLowerCase()
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


/* ==========================================================================
   087 — OPPORTUNITY SEARCH MATCHER
   ========================================================================== */

function opportunityMatchesQuery(
    opportunity,
    query
) {

    if (
        !opportunity
    ) {

        return false;

    }


    var normalizedQuery =
        normalizeSearchQuery(
            query
        );


    if (
        !normalizedQuery
    ) {

        return true;

    }


    var searchableFields = [

        opportunity.title,

        opportunity.name,

        opportunity.organization,

        opportunity.provider,

        opportunity.country,

        opportunity.location,

        opportunity.category,

        opportunity.description,

        opportunity.summary,

        opportunity.tags

    ];


    var searchableText =
        searchableFields
            .map(
                function (
                    value
                ) {

                    if (
                        Array.isArray(
                            value
                        )
                    ) {

                        return value.join(
                            " "
                        );

                    }


                    return String(
                        value ||
                        ""
                    );

                }
            )
            .join(
                " "
            )
            .toLowerCase();


    return searchableText.indexOf(
        normalizedQuery
    ) !== -1;

}


/* ==========================================================================
   088 — FILTER VALUE MATCHER
   ========================================================================== */

function matchesFilterValue(
    opportunity,
    field,
    expected
) {

    if (
        expected ===
        undefined ||
        expected ===
        null ||
        expected ===
        "" ||
        expected ===
        "all"
    ) {

        return true;

    }


    var actual =
        opportunity
            ? opportunity[field]
            : null;


    if (
        Array.isArray(
            actual
        )
    ) {

        return actual
            .map(
                function (
                    value
                ) {

                    return normalizeText(
                        value
                    )
                        .toLowerCase();

                }
            )
            .indexOf(
                normalizeText(
                    expected
                )
                    .toLowerCase()
            ) !== -1;

    }


    return normalizeText(
        actual
    )
        .toLowerCase() ===
        normalizeText(
            expected
        )
            .toLowerCase();

}


/* ==========================================================================
   089 — OPPORTUNITY FILTER ENGINE
   ========================================================================== */

function filterOpportunities(
    opportunities,
    filters
) {

    if (
        !Array.isArray(
            opportunities
        )
    ) {

        return [];

    }


    filters =
        Object.assign(
            {},
            FilterStore.defaults,
            filters ||
                {}
        );


    return opportunities.filter(
        function (
            opportunity
        ) {

            if (
                !opportunityMatchesQuery(
                    opportunity,
                    filters.query
                )
            ) {

                return false;

            }


            if (
                !matchesFilterValue(
                    opportunity,
                    "category",
                    filters.category
                )
            ) {

                return false;

            }


            if (
                !matchesFilterValue(
                    opportunity,
                    "country",
                    filters.country
                )
            ) {

                return false;

            }


            if (
                !matchesFilterValue(
                    opportunity,
                    "funding",
                    filters.funding
                )
            ) {

                return false;

            }


            if (
                !matchesFilterValue(
                    opportunity,
                    "educationLevel",
                    filters.educationLevel
                )
            ) {

                return false;

            }


            return true;

        }
    );

}


/* ==========================================================================
   090 — OPPORTUNITY SORT ENGINE
   ========================================================================== */

function sortOpportunities(
    opportunities,
    sortMode
) {

    if (
        !Array.isArray(
            opportunities
        )
    ) {

        return [];

    }


    var sorted =
        opportunities.slice();


    switch (
        sortMode
    ) {

        case "deadline":

            sorted.sort(
                compareOpportunityDeadline
            );

            break;


        case "newest":

            sorted.sort(
                compareOpportunityDate
            );

            break;


        case "funding":

            sorted.sort(
                compareOpportunityFunding
            );

            break;


        case "name":

            sorted.sort(
                compareOpportunityName
            );

            break;


        case "relevance":

        default:

            break;

    }


    return sorted;

}


/* ==========================================================================
   091 — DEADLINE COMPARATOR
   ========================================================================== */

function compareOpportunityDeadline(
    first,
    second
) {

    var firstDate =
        parseOpportunityDate(
            first &&
            first.deadline
        );


    var secondDate =
        parseOpportunityDate(
            second &&
            second.deadline
        );


    if (
        !firstDate &&
        !secondDate
    ) {

        return 0;

    }


    if (
        !firstDate
    ) {

        return 1;

    }


    if (
        !secondDate
    ) {

        return -1;

    }


    return (
        firstDate.getTime() -
        secondDate.getTime()
    );

}


/* ==========================================================================
   092 — DATE COMPARATOR
   ========================================================================== */

function compareOpportunityDate(
    first,
    second
) {

    var firstDate =
        parseOpportunityDate(
            first &&
            (
                first.publishedAt ||
                first.createdAt
            )
        );


    var secondDate =
        parseOpportunityDate(
            second &&
            (
                second.publishedAt ||
                second.createdAt
            )
        );


    if (
        !firstDate &&
        !secondDate
    ) {

        return 0;

    }


    if (
        !firstDate
    ) {

        return 1;

    }


    if (
        !secondDate
    ) {

        return -1;

    }


    return (
        secondDate.getTime() -
        firstDate.getTime()
    );

}


/* ==========================================================================
   093 — FUNDING COMPARATOR
   ========================================================================== */

function compareOpportunityFunding(
    first,
    second
) {

    var firstValue =
        getOpportunityFundingScore(
            first
        );


    var secondValue =
        getOpportunityFundingScore(
            second
        );


    return (
        secondValue -
        firstValue
    );

}


/* ==========================================================================
   094 — NAME COMPARATOR
   ========================================================================== */

function compareOpportunityName(
    first,
    second
) {

    var firstName =
        normalizeText(
            first &&
            (
                first.title ||
                first.name
            )
        )
            .toLowerCase();


    var secondName =
        normalizeText(
            second &&
            (
                second.title ||
                second.name
            )
        )
            .toLowerCase();


    return firstName.localeCompare(
        secondName
    );

}


/* ==========================================================================
   095 — OPPORTUNITY DATE PARSER
   ========================================================================== */

function parseOpportunityDate(
    value
) {

    if (
        value instanceof Date
    ) {

        return isNaN(
            value.getTime()
        )
            ? null
            : value;

    }


    if (
        !value
    ) {

        return null;

    }


    var date =
        new Date(
            value
        );


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return null;

    }


    return date;

}


/* ==========================================================================
   096 — FUNDING SCORE
   ========================================================================== */

function getOpportunityFundingScore(
    opportunity
) {

    if (
        !opportunity
    ) {

        return 0;

    }


    var funding =
        normalizeText(
            opportunity.funding
        )
            .toLowerCase();


    if (
        funding.indexOf(
            "full"
        ) !== -1 ||
        funding.indexOf(
            "100%"
        ) !== -1
    ) {

        return 100;

    }


    if (
        funding.indexOf(
            "scholarship"
        ) !== -1 ||
        funding.indexOf(
            "grant"
        ) !== -1
    ) {

        return 75;

    }


    if (
        funding.indexOf(
            "partial"
        ) !== -1
    ) {

        return 50;

    }


    return 0;

}


/* ==========================================================================
   097 — SEARCH EXECUTION
   ========================================================================== */

function searchOpportunities(
    query,
    options
) {

    options =
        options ||
        {};


    var filters =
        Object.assign(
            {},
            FilterStore.get(),
            options.filters ||
                {},
            {
                query:
                    query !==
                    undefined
                        ? query
                        : FilterStore.get()
                            .query
            }
        );


    var source =
        Array.isArray(
            options.source
        )
            ? options.source
            : OpportunityStore.get();


    var filtered =
        filterOpportunities(
            source,
            filters
        );


    var sorted =
        sortOpportunities(
            filtered,
            filters.sort
        );


    EventBus.emit(
        "search:completed",
        {
            query:
                filters.query,

            filters:
                filters,

            results:
                sorted.slice(),

            count:
                sorted.length
        }
    );


    return sorted;

}


/* ==========================================================================
   098 — PUBLIC SEARCH API
   ========================================================================== */

PathForage.search = {

    run:
        function (
            query,
            options
        ) {

            return searchOpportunities(
                query,
                options
            );

        },


    filter:
        function (
            opportunities,
            filters
        ) {

            return filterOpportunities(
                opportunities,
                filters
            );

        },


    sort:
        function (
            opportunities,
            sortMode
        ) {

            return sortOpportunities(
                opportunities,
                sortMode
            );

        }

};


/* ==========================================================================
   099 — SEARCH QUERY STATE SYNCHRONIZATION
   ========================================================================== */

function setSearchQuery(
    query
) {

    var normalized =
        normalizeSearchQuery(
            query
        );


    var filters =
        FilterStore.set(
            {
                query:
                    normalized
            }
        );


    EventBus.emit(
        "search:queryChanged",
        {
            query:
                normalized
        }
    );


    return filters;

}


/* ==========================================================================
   100 — PUBLIC SEARCH QUERY API
   ========================================================================== */

PathForage.search.query = {

    get:
        function () {

            return FilterStore
                .get()
                .query;

        },


    set:
        function (
            query
        ) {

            return setSearchQuery(
                query
            );

        },


    clear:
        function () {

            return setSearchQuery(
                ""
            );

        }

};


/* ==========================================================================
   101 — END OF PART 9
   --------------------------------------------------------------------------
   PART 10 MUST CONTINUE DIRECTLY BELOW THIS LINE.

   DO NOT ADD:
   - </script>
   - <script>
   - HTML
   - CSS
   - closing document tags

   This remains one continuous standalone JavaScript file.
   ========================================================================== */
/* ==========================================================================
   102 — APPLICATION RENDER CONTROLLER
   ========================================================================== */

var RenderController = {

    scheduled:
        false,

    frame:
        null,


    schedule:
        function () {

            if (
                this.scheduled
            ) {

                return;

            }


            this.scheduled =
                true;


            var self =
                this;


            var callback =
                function () {

                    self.scheduled =
                        false;

                    self.frame =
                        null;

                    self.render();

                };


            if (
                typeof window !==
                "undefined" &&
                typeof window.requestAnimationFrame ===
                "function"
            ) {

                this.frame =
                    window.requestAnimationFrame(
                        callback
                    );

            } else {

                this.frame =
                    setTimeout(
                        callback,
                        16
                    );

            }

        },


    render:
        function () {

            EventBus.emit(
                "render:requested",
                {
                    view:
                        PathForage.view.get(),

                    opportunities:
                        OpportunityStore.get(),

                    filters:
                        FilterStore.get(),

                    selection:
                        PathForage.selection.get()
                }
            );

        },


    cancel:
        function () {

            if (
                this.frame ===
                null
            ) {

                return;

            }


            if (
                typeof window !==
                "undefined" &&
                typeof window.cancelAnimationFrame ===
                "function"
            ) {

                window.cancelAnimationFrame(
                    this.frame
                );

            } else {

                clearTimeout(
                    this.frame
                );

            }


            this.frame =
                null;

            this.scheduled =
                false;

        }

};


/* ==========================================================================
   103 — DOM NODE REGISTRY
   ========================================================================== */

var DOMRegistry = {

    nodes:
        {},


    register:
        function (
            key,
            element
        ) {

            if (
                !key
            ) {

                return null;

            }


            this.nodes[
                key
            ] =
                element ||
                null;


            return this.nodes[
                key
            ];

        },


    get:
        function (
            key
        ) {

            return (
                this.nodes[
                    key
                ] ||
                null
            );

        },


    remove:
        function (
            key
        ) {

            if (
                Object.prototype.hasOwnProperty.call(
                    this.nodes,
                    key
                )
            ) {

                delete this.nodes[
                    key
                ];

                return true;

            }


            return false;

        },


    clear:
        function () {

            this.nodes =
                {};

        }

};


/* ==========================================================================
   104 — DOM DISCOVERY
   ========================================================================== */

function discoverDOM() {

    if (
        typeof document ===
        "undefined"
    ) {

        return;

    }


    var selectors = {

        app:
            "[data-pathforage-app]",

        main:
            "main",

        search:
            "[data-pf-search]",

        searchInput:
            "[data-pf-search-input]",

        opportunityList:
            "[data-pf-opportunity-list]",

        opportunityCount:
            "[data-pf-opportunity-count]",

        activeView:
            "[data-pf-active-view]",

        blueprint:
            "[data-pf-blueprint]",

        loading:
            "[data-pf-loading]"

    };


    Object.keys(
        selectors
    ).forEach(
        function (
            key
        ) {

            DOMRegistry.register(
                key,
                document.querySelector(
                    selectors[
                        key
                    ]
                )
            );

        }
    );


    EventBus.emit(
        "dom:discovered"
    );

}


/* ==========================================================================
   105 — TEXT UPDATE HELPER
   ========================================================================== */

function updateText(
    element,
    value
) {

    if (
        !element
    ) {

        return;

    }


    setText(
        element,
        value ===
            undefined ||
        value ===
            null
            ? ""
            : value
    );

}


/* ==========================================================================
   106 — OPPORTUNITY COUNT RENDERER
   ========================================================================== */

function renderOpportunityCount(
    count
) {

    var element =
        DOMRegistry.get(
            "opportunityCount"
        );


    if (
        !element
    ) {

        return;

    }


    updateText(
        element,
        String(
            Number(
                count
            ) || 0
        )
    );

}


/* ==========================================================================
   107 — ACTIVE VIEW RENDERER
   ========================================================================== */

function renderActiveView(
    view
) {

    var elements =
        document.querySelectorAll(
            "[data-pf-view]"
        );


    if (
        !elements ||
        !elements.length
    ) {

        return;

    }


    elements.forEach(
        function (
            element
        ) {

            var elementView =
                normalizeText(
                    element.getAttribute(
                        "data-pf-view"
                    )
                );


            var active =
                elementView ===
                view;


            element.hidden =
                !active;


            element.setAttribute(
                "aria-hidden",
                active
                    ? "false"
                    : "true"
            );


            element.classList.toggle(
                "is-active",
                active
            );

        }
    );


    var activeViewElements =
        document.querySelectorAll(
            "[data-pf-active-view]"
        );


    activeViewElements.forEach(
        function (
            element
        ) {

            updateText(
                element,
                view
            );

        }
    );

}


/* ==========================================================================
   108 — OPPORTUNITY CARD CREATION
   ========================================================================== */

function createOpportunityCard(
    opportunity
) {

    if (
        !opportunity ||
        typeof document ===
        "undefined"
    ) {

        return null;

    }


    var card =
        document.createElement(
            "article"
        );


    card.className =
        "pf-opportunity-mini-card";


    if (
        opportunity.id
    ) {

        card.setAttribute(
            "data-opportunity-id",
            opportunity.id
        );

    }


    var title =
        document.createElement(
            "h3"
        );


    title.className =
        "pf-opportunity-mini-card__title";


    updateText(
        title,
        opportunity.title ||
        opportunity.name ||
        "Opportunity"
    );


    card.appendChild(
        title
    );


    if (
        opportunity.organization ||
        opportunity.provider
    ) {

        var organization =
            document.createElement(
                "p"
            );


        organization.className =
            "pf-opportunity-mini-card__organization";


        updateText(
            organization,
            opportunity.organization ||
            opportunity.provider
        );


        card.appendChild(
            organization
        );

    }


    if (
        opportunity.country
    ) {

        var country =
            document.createElement(
                "p"
            );


        country.className =
            "pf-opportunity-mini-card__country";


        updateText(
            country,
            opportunity.country
        );


        card.appendChild(
            country
        );

    }


    if (
        opportunity.deadline
    ) {

        var deadline =
            document.createElement(
                "p"
            );


        deadline.className =
            "pf-opportunity-mini-card__deadline";


        updateText(
            deadline,
            "Deadline: " +
            opportunity.deadline
        );


        card.appendChild(
            deadline
        );

    }


    card.setAttribute(
        "tabindex",
        "0"
    );


    card.addEventListener(
        "click",
        function () {

            PathForage.selection.set(
                opportunity
            );

        }
    );


    card.addEventListener(
        "keydown",
        function (
            event
        ) {

            if (
                event.key ===
                    "Enter" ||
                event.key ===
                    " "
            ) {

                event.preventDefault();


                PathForage.selection.set(
                    opportunity
                );

            }

        }
    );


    return card;

}


/* ==========================================================================
   109 — OPPORTUNITY LIST RENDERER
   ========================================================================== */

function renderOpportunityList(
    opportunities
) {

    var container =
        DOMRegistry.get(
            "opportunityList"
        );


    if (
        !container
    ) {

        return;

    }


    container.replaceChildren();


    if (
        !Array.isArray(
            opportunities
        ) ||
        opportunities.length ===
            0
    ) {

        var empty =
            document.createElement(
                "p"
            );


        empty.className =
            "pf-empty-state";


        updateText(
            empty,
            "No opportunities match your current filters."
        );


        container.appendChild(
            empty
        );


        renderOpportunityCount(
            0
        );


        return;

    }


    var fragment =
        document.createDocumentFragment();


    opportunities.forEach(
        function (
            opportunity
        ) {

            var card =
                createOpportunityCard(
                    opportunity
                );


            if (
                card
            ) {

                fragment.appendChild(
                    card
                );

            }

        }
    );


    container.appendChild(
        fragment
    );


    renderOpportunityCount(
        opportunities.length
    );

}


/* ==========================================================================
   110 — COMPLETE APPLICATION RENDER
   ========================================================================== */

function renderApplication() {

    if (
        typeof document ===
        "undefined"
    ) {

        return;

    }


    var view =
        PathForage.view.get();


    var filters =
        FilterStore.get();


    var opportunities =
        searchOpportunities(
            filters.query,
            {
                filters:
                    filters
            }
        );


    renderActiveView(
        view
    );


    renderOpportunityList(
        opportunities
    );


    EventBus.emit(
        "application:rendered",
        {
            view:
                view,

            filters:
                filters,

            opportunities:
                opportunities
        }
    );

}


/* ==========================================================================
   111 — SEARCH INPUT BINDING
   ========================================================================== */

function bindSearchInput(
    input
) {

    if (
        !input
    ) {

        return;

    }


    input.value =
        FilterStore.get()
            .query;


    input.addEventListener(
        "input",
        function (
            event
        ) {

            var value =
                event.target
                    ? event.target.value
                    : "";


            setSearchQuery(
                value
            );


            RenderController.schedule();

        }
    );


    input.addEventListener(
        "search",
        function (
            event
        ) {

            var value =
                event.target
                    ? event.target.value
                    : "";


            setSearchQuery(
                value
            );


            RenderController.schedule();

        }
    );

}


/* ==========================================================================
   112 — VIEW CONTROL BINDING
   ========================================================================== */

function bindViewControls() {

    if (
        typeof document ===
        "undefined"
    ) {

        return;

    }


    var controls =
        document.querySelectorAll(
            "[data-pf-view-target]"
        );


    controls.forEach(
        function (
            control
        ) {

            control.addEventListener(
                "click",
                function () {

                    var target =
                        normalizeText(
                            control.getAttribute(
                                "data-pf-view-target"
                            )
                        );


                    if (
                        !target
                    ) {

                        return;

                    }


                    PathForage.view.set(
                        target
                    );


                    RenderController.schedule();

                }
            );

        }
    );

}


/* ==========================================================================
   113 — APPLICATION EVENT BINDING
   ========================================================================== */

function bindApplicationEvents() {

    EventBus.on(
        "filters:changed",
        function () {

            RenderController.schedule();

        }
    );


    EventBus.on(
        "filters:reset",
        function () {

            RenderController.schedule();

        }
    );


    EventBus.on(
        "opportunities:updated",
        function () {

            RenderController.schedule();

        }
    );


    EventBus.on(
        "opportunity:added",
        function () {

            RenderController.schedule();

        }
    );


    EventBus.on(
        "opportunity:removed",
        function () {

            RenderController.schedule();

        }
    );


    EventBus.on(
        "opportunities:cleared",
        function () {

            RenderController.schedule();

        }
    );


    EventBus.on(
        "view:changed",
        function () {

            RenderController.schedule();

        }
    );


    EventBus.on(
        "search:queryChanged",
        function () {

            RenderController.schedule();

        }
    );

}


/* ==========================================================================
   114 — APPLICATION INITIALIZATION
   ========================================================================== */

function initializeApplication() {

    discoverDOM();


    var searchInput =
        DOMRegistry.get(
            "searchInput"
        );


    bindSearchInput(
        searchInput
    );


    bindViewControls();


    bindApplicationEvents();


    renderApplication();


    EventBus.emit(
        "application:ready"
    );


    if (
        typeof document !==
        "undefined"
    ) {

        document.documentElement
            .setAttribute(
                "data-pathforage-ready",
                "true"
            );

    }

}


/* ==========================================================================
   115 — DOM READY BOOTSTRAP
   ========================================================================== */

function bootPathForage() {

    if (
        runtime &&
        runtime.booted
    ) {

        return;

    }


    if (
        runtime
    ) {

        runtime.booted =
            true;

    }


    initializeApplication();

}


/* ==========================================================================
   116 — GLOBAL ERROR BOUNDARY
   ========================================================================== */

function initializeErrorBoundary() {

    if (
        typeof window ===
        "undefined"
    ) {

        return;

    }


    window.addEventListener(
        "error",
        function (
            event
        ) {

            EventBus.emit(
                "application:error",
                {
                    type:
                        "error",

                    message:
                        event.message ||
                        "Unknown application error"
                }
            );

        }
    );


    window.addEventListener(
        "unhandledrejection",
        function (
            event
        ) {

            EventBus.emit(
                "application:error",
                {
                    type:
                        "unhandledrejection",

                    reason:
                        event.reason ||
                        null
                }
            );

        }
    );

}


/* ==========================================================================
   117 — PUBLIC RENDER API
   ========================================================================== */

PathForage.render = {

    now:
        function () {

            renderApplication();

        },


    schedule:
        function () {

            RenderController.schedule();

        },


    cancel:
        function () {

            RenderController.cancel();

        }

};


/* ==========================================================================
   118 — PUBLIC BOOT API
   ========================================================================== */

PathForage.boot = {

    start:
        function () {

            bootPathForage();

        },


    status:
        function () {

            return Boolean(
                runtime &&
                runtime.booted
            );

        }

};


/* ==========================================================================
   119 — FINAL RUNTIME INITIALIZATION
   ========================================================================== */

initializeErrorBoundary();


if (
    typeof document !==
    "undefined"
) {

    if (
        document.readyState ===
            "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            bootPathForage,
            {
                once:
                    true
            }
        );

    } else {

        bootPathForage();

    }

}


/* ==========================================================================
   120 — FINAL PATHFORAGE API EXPOSURE
   ========================================================================== */

if (
    typeof window !==
    "undefined"
) {

    window.PathForage =
        PathForage;

}


/* ==========================================================================
   121 — APPLICATION FOUNDATION COMPLETE
   --------------------------------------------------------------------------

   This file intentionally ends without:

   - </script>
   - <script>
   - HTML
   - CSS
   - closing document tags

   Google Analytics and Google AdSense initialization belong in the
   dedicated integration layer established earlier in this application,
   rather than being duplicated here.

   The PathForage runtime now exposes:

   - PathForage.config
   - PathForage.runtime
   - PathForage.utils
   - PathForage.storage
   - PathForage.analytics
   - PathForage.adsense
   - PathForage.view
   - PathForage.selection
   - PathForage.opportunities
   - PathForage.filters
   - PathForage.search
   - PathForage.render
   - PathForage.boot

   END OF MAIN JAVASCRIPT FOUNDATION.
   ========================================================================== */
