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
        return window.userStorage.saveProjects(projects);
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

    function searchProjects(keyword) {
        const key = normalizeText(keyword);
        const projects = getProjects();

        if (!key) return projects.slice(0, 8);

        return projects.filter((item) => {
            return (
                normalizeText(item.name).includes(key) ||
                normalizeText(item.slug).includes(key) ||
                normalizeText(item.city || "").includes(key) ||
                normalizeText(item.type || "").includes(key)
            );
        }).slice(0, 8);
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

        if (existing) {
            existing.name = existing.name || projectData.name;
            existing.slug = existing.slug || projectSlug;
            existing.city = existing.city || projectData.city || "";
            existing.ward = existing.ward || projectData.ward || "";
            existing.addressDetail = existing.addressDetail || projectData.addressDetail || "";
            existing.type = existing.type || projectData.type || "";
            existing.developer = existing.developer || projectData.developer || "";
            existing.updatedAt = new Date().toISOString();

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
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastPostAt: projectData.lastPostAt || ""
        };

        projects.unshift(newProject);
        saveProjects(projects);
        return newProject;
    }

    function syncProjectCounts(postsInput) {
        const posts = Array.isArray(postsInput)
            ? postsInput
            : (window.postStorage ? window.postStorage.getAllPosts() : window.userStorage.getAllPosts());

        const projects = getProjects();

        const nextProjects = projects.map((project) => {
            const relatedPosts = posts.filter(
                (post) => post && post.projectSlug && post.projectSlug === project.slug
            );

            const salePosts = relatedPosts.filter((post) => post.postType === "ban");
            const rentalPosts = relatedPosts.filter((post) => post.postType === "thue");

            let avgPricePerSquareMeter = null;
            const validSalePrices = salePosts
                .map((post) => post.pricePerSquareMeter)
                .filter((value) => typeof value === "number" && value > 0);

            if (validSalePrices.length) {
                avgPricePerSquareMeter = Math.round(
                    validSalePrices.reduce((sum, value) => sum + value, 0) / validSalePrices.length
                );
            }

            return {
                ...project,
                postCount: relatedPosts.length,
                saleCount: salePosts.length,
                rentalCount: rentalPosts.length,
                averageSalePricePerSquareMeter: avgPricePerSquareMeter,
                lastPostAt:
                    relatedPosts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0]?.createdAt ||
                    project.lastPostAt ||
                    project.createdAt,
                updatedAt: new Date().toISOString()
            };
        });

        saveProjects(nextProjects);
        return nextProjects;
    }

    function getProjectPosts(projectSlug) {
        if (!projectSlug) return [];

        if (window.postStorage) {
            return window.postStorage.getPostsByProjectSlug(projectSlug);
        }

        return window.userStorage.getAllPosts().filter(
            (post) => post && post.projectSlug === projectSlug
        );
    }

    function getProjectDetail(projectSlug) {
        const project = findProjectBySlug(projectSlug);
        if (!project) return null;

        const posts = getProjectPosts(projectSlug);
        const salePosts = posts.filter((post) => post.postType === "ban");
        const rentalPosts = posts.filter((post) => post.postType === "thue");

        return {
            ...project,
            posts,
            salePosts,
            rentalPosts
        };
    }

    function getProjectsByUser(user) {
        const currentUser = user || (window.userStorage ? window.userStorage.getCurrentUser() : null);
        if (!currentUser) return [];

        const allPosts = window.postStorage
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
        getProjectsByUser
    };
})();
