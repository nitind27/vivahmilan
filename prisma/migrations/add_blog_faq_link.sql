-- Link FAQs to a specific blog post (NULL = global FAQ for blog/help pages)
ALTER TABLE `faqitem`
  ADD COLUMN IF NOT EXISTS `blogPostId` VARCHAR(191) NULL DEFAULT NULL AFTER `showOnHelp`,
  ADD KEY IF NOT EXISTS `faqitem_blog_post_idx` (`blogPostId`, `isActive`, `sortOrder`);
