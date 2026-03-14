(function () {
    "use strict";

    function ensureUserStorage() {
        if (!window.userStorage) {
            throw new Error("projectService cần userStorage.js được load trước");
        }
    }

    function normalizeText(str) {
        return (str || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/\s+/g, " ")
            .trim();
    }

    function slugify(str) {
        return (str || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/[^a-z0-9\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");
    }

    function getProjects() {
        ensureUserStorage();
        return window.userStorage.getProjects();
    }

    function saveProjects(projects) {
        ensureUserStorage();
        const safeProjects = Array.isArray(projects) ? projects : [];
        window.userStorage.saveProjects(safeProjects);
        return safeProjects;
    }

    function findProjectBySlug(slug) {
        if (!slug) return null;
        return getProjects().find((item) => item.slug === slug) || null;
    }

    function findProjectByName(name) {
        if (!name) return null;
        const normalized = normalizeText(name);
        return getProjects().find((item) => normalizeText(item.name) === normalized) || null;
    }

    function searchProjects(keyword, limit) {
        const key = normalizeText(keyword);
        const projects = getProjects();
        const maxItems = typeof limit === "number" && limit > 0 ? limit : 8;

        if (!key) return projects.slice(0, maxItems);

        return projects
            .filter((item) => {
                return (
                    normalizeText(item.name).includes(key) ||
                    normalizeText(item.slug).includes(key) ||
                    normalizeText(item.city || "").includes(key) ||
                    normalizeText(item.type || "").includes(key) ||
                    normalizeText(item.developer || "").includes(key)
                );
            })
            .slice(0, maxItems);
    }

    function upsertProject(projectData) {
        if (!projectData || !projectData.name) {
            return null;
        }

        const projects = getProjects();
        const projectSlug = projectData.slug || slugify(projectData.name);

        const existing = projects.find(
            (item) =>
                item.slug === projectSlug ||
                normalizeText(item.name) === normalizeText(projectData.name)
        );

        const now = new Date().toISOString();

        if (existing) {
            existing.name = projectData.name || existing.name;
            existing.slug = existing.slug || projectSlug;
            existing.city = projectData.city || existing.city || "";
            existing.ward = projectData.ward || existing.ward || "";
            existing.addressDetail = projectData.addressDetail || existing.addressDetail || "";
            existing.type = projectData.type || existing.type || "";
            existing.developer = projectData.developer || existing.developer || "";
            existing.seoTitle =
                projectData.seoTitle ||
                existing.seoTitle ||
                `Mua bán, cho thuê bất động sản ${existing.name}`;
            existing.seoDescription =
                projectData.seoDescription ||
                existing.seoDescription ||
                `Tổng hợp tin mua bán, cho thuê bất động sản tại ${existing.name}. Cập nhật giá, vị trí và thông tin dự án mới nhất.`;
            existing.postCount = typeof projectData.postCount === "number" ? projectData.postCount : (existing.postCount || 0);
            existing.saleCount = typeof projectData.saleCount === "number" ? projectData.saleCount : (existing.saleCount || 0);
            existing.rentalCount = typeof projectData.rentalCount === "number" ? projectData.rentalCount : (existing.rentalCount || 0);
            existing.averageSalePricePerSquareMeter =
                typeof projectData.averageSalePricePerSquareMeter === "number"
                    ? projectData.averageSalePricePerSquareMeter
                    : (existing.averageSalePricePerSquareMeter || null);
            existing.lastPostAt = projectData.lastPostAt || existing.lastPostAt || "";
            existing.updatedAt = now;

            saveProjects(projects);
            return existing;
        }

        const newProject = {
            id: projectData.id || "project_" + projectSlug,
            name: projectData.name,
            slug: projectSlug,
            city: projectData.city || "",
            ward: projectData.ward || "",
            addressDetail: projectData.addressDetail || "",
            type: projectData.type || "",
            developer: projectData.developer || "",
            seoTitle: projectData.seoTitle || `Mua bán, cho thuê bất động sản ${projectData.name}`,
            seoDescription:
                projectData.seoDescription ||
                `Tổng hợp tin mua bán, cho thuê bất động sản tại ${projectData.name}. Cập nhật giá, vị trí và thông tin dự án mới nhất.`,
            postCount: projectData.postCount || 0,
            saleCount: projectData.saleCount || 0,
            rentalCount: projectData.rentalCount || 0,
            averageSalePricePerSquareMeter:
                typeof projectData.averageSalePricePerSquareMeter === "number"
                    ? projectData.averageSalePricePerSquareMeter
                    : null,
            createdAt: now,
            updatedAt: now,
            lastPostAt: projectData.lastPostAt || ""
        };

        projects.unshift(newProject);
        saveProjects(projects);
        return newProject;
    }

    function getSourcePosts(postsInput) {
        if (Array.isArray(postsInput)) return postsInput;

        if (window.postStorage && typeof window.postStorage.getAllPosts === "function") {
            return window.postStorage.getAllPosts();
        }

        ensureUserStorage();
        return window.userStorage.getAllPosts();
    }

    function filterPostsByApproval(posts, approvedOnly) {
        if (!approvedOnly) return posts;
        return posts.filter((post) => post && post.status === "approved");
    }

    function syncProjectCounts(postsInput, approvedOnly) {
        const posts = filterPostsByApproval(getSourcePosts(postsInput), !!approvedOnly);
        const projects = getProjects();

        const nextProjects = projects.map((project) => {
            const relatedPosts = posts.filter(
                (post) => post && post.projectSlug && post.projectSlug === project.slug
            );

            const salePosts = relatedPosts.filter(
                (post) => post && post.flow === "real_estate" && post.postType === "ban"
            );
            const rentalPosts = relatedPosts.filter(
                (post) => post && post.flow === "real_estate" && post.postType === "thue"
            );

            const validSalePrices = salePosts
                .map((post) => post.pricePerSquareMeter)
                .filter((value) => typeof value === "number" && value > 0);

            const avgPricePerSquareMeter = validSalePrices.length
                ? Math.round(validSalePrices.reduce((sum, value) => sum + value, 0) / validSalePrices.length)
                : null;

            const latestPost = relatedPosts
                .slice()
                .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];

            return {
                ...project,
                postCount: relatedPosts.length,
                saleCount: salePosts.length,
                rentalCount: rentalPosts.length,
                averageSalePricePerSquareMeter: avgPricePerSquareMeter,
                lastPostAt: latestPost?.createdAt || project.lastPostAt || project.createdAt || "",
                updatedAt: new Date().toISOString()
            };
        });

        saveProjects(nextProjects);
        return nextProjects;
    }

    function getProjectPosts(projectSlug, approvedOnly) {
        if (!projectSlug) return [];

        const posts = window.postStorage && typeof window.postStorage.getPostsByProjectSlug === "function"
            ? window.postStorage.getPostsByProjectSlug(projectSlug)
            : getSourcePosts().filter((post) => post && post.projectSlug === projectSlug);

        return filterPostsByApproval(posts, !!approvedOnly);
    }

    function getProjectDetail(projectSlug, approvedOnly) {
        const project = findProjectBySlug(projectSlug);
        if (!project) return null;

        const posts = getProjectPosts(projectSlug, !!approvedOnly);
        const salePosts = posts.filter(
            (post) => post && post.flow === "real_estate" && post.postType === "ban"
        );
        const rentalPosts = posts.filter(
            (post) => post && post.flow === "real_estate" && post.postType === "thue"
        );

        return {
            ...project,
            posts,
            salePosts,
            rentalPosts
        };
    }

    function getPublicProjects() {
        return getProjects()
            .filter((project) => (project.postCount || 0) > 0)
            .sort((a, b) => {
                const aTime = new Date(a.lastPostAt || a.updatedAt || 0).getTime();
                const bTime = new Date(b.lastPostAt || b.updatedAt || 0).getTime();
                return bTime - aTime;
            });
    }

    function getProjectsByUser(user) {
        const currentUser = user || (window.userStorage ? window.userStorage.getCurrentUser() : null);
        if (!currentUser) return [];

        const allPosts = window.postStorage && typeof window.postStorage.getPostsByUser === "function"
            ? window.postStorage.getPostsByUser(currentUser)
            : window.userStorage.getMyPosts(currentUser);

        const slugs = [...new Set(allPosts.map((post) => post.projectSlug).filter(Boolean))];
        return getProjects().filter((project) => slugs.includes(project.slug));
    }

    window.projectService = {
        normalizeText,
        slugify,
        getProjects,
        saveProjects,
        findProjectBySlug,
        findProjectByName,
        searchProjects,
        upsertProject,
        syncProjectCounts,
        getProjectPosts,
        getProjectDetail,
        getPublicProjects,
        getProjectsByUser
    };
})();
