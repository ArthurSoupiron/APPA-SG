"use client";

import { Package } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/theme-toggle";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "@/components/ui/button-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar";
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const COMBO_ITEMS = ["Next.js", "Remix", "Astro", "Nuxt"] as const;

const CHART_DATA = [
  { month: "Jan", desktop: 120 },
  { month: "Fév", desktop: 180 },
  { month: "Mar", desktop: 150 },
];
const CHART_CONFIG = {
  desktop: { label: "Desktop", color: "var(--chart-1)" },
} satisfies import("@/components/ui/chart").ChartConfig;

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("scroll-mt-24 space-y-4 border-b border-border/60 pb-10", className)}>
      <h2 className="font-heading text-lg font-semibold tracking-tight">{title}</h2>
      <div className="flex flex-col flex-wrap gap-4 md:flex-row md:items-start">{children}</div>
    </section>
  );
}

export function UiAllShowcase() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [progress, setProgress] = React.useState(33);
  const [sliderVal, setSliderVal] = React.useState([50]);

  React.useEffect(() => {
    const t = setInterval(() => {
      setProgress((p) => (p >= 100 ? 20 : p + 8));
    }, 900);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 px-4 py-4 backdrop-blur-md supports-backdrop-filter:bg-background/80 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
              Galerie UI — <code className="text-sm font-mono">components/ui</code>
            </h1>
            <p className="text-muted-foreground text-sm">
              shadcn (radix-luma) — route <code className="font-mono">/ui_all</code>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/">Accueil</Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6">
        <Section title="Accordion">
          <Accordion type="single" collapsible className="w-full max-w-md">
            <AccordionItem value="a">
              <AccordionTrigger>Section A</AccordionTrigger>
              <AccordionContent>Contenu repliable pour la section A.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="b">
              <AccordionTrigger>Section B</AccordionTrigger>
              <AccordionContent>Contenu pour la section B.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </Section>

        <Section title="Alert">
          <Alert className="max-w-md">
            <AlertTitle>Titre</AlertTitle>
            <AlertDescription>Description de l’alerte avec du texte secondaire.</AlertDescription>
            <AlertAction>
              <Button size="sm" variant="outline">
                Action
              </Button>
            </AlertAction>
          </Alert>
        </Section>

        <Section title="Alert dialog">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">Ouvrir alert dialog</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer ?</AlertDialogTitle>
                <AlertDialogDescription>Action sensible (démo uniquement).</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction>Continuer</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Section>

        <Section title="Aspect ratio">
          <div className="w-48 overflow-hidden rounded-xl border">
            <AspectRatio ratio={16 / 9}>
              <div className="flex size-full items-center justify-center bg-muted text-sm">
                16:9
              </div>
            </AspectRatio>
          </div>
        </Section>

        <Section title="Avatar">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar>
              <AvatarImage src="" alt="" />
              <AvatarFallback>JM</AvatarFallback>
            </Avatar>
            <Avatar className="relative">
              <AvatarFallback>CV</AvatarFallback>
              <AvatarBadge className="bg-green-500" />
            </Avatar>
            <AvatarGroup>
              <Avatar className="size-8 border-2 border-background">
                <AvatarFallback className="text-xs">A</AvatarFallback>
              </Avatar>
              <Avatar className="size-8 border-2 border-background">
                <AvatarFallback className="text-xs">B</AvatarFallback>
              </Avatar>
              <AvatarGroupCount>+3</AvatarGroupCount>
            </AvatarGroup>
          </div>
        </Section>

        <Section title="Badge">
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
        </Section>

        <Section title="Breadcrumb">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Accueil</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/account">Compte</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>UI</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </Section>

        <Section title="Button">
          <div className="flex flex-wrap gap-2">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
          </div>
        </Section>

        <Section title="Button group">
          <ButtonGroup>
            <Button variant="outline" size="sm">
              Gauche
            </Button>
            <ButtonGroupSeparator orientation="vertical" />
            <Button variant="outline" size="sm">
              Droite
            </Button>
          </ButtonGroup>
          <ButtonGroupText>Texte du groupe</ButtonGroupText>
        </Section>

        <Section title="Calendar">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-xl border shadow-sm"
          />
        </Section>

        <Section title="Card">
          <Card className="max-w-sm">
            <CardHeader>
              <CardTitle>Carte</CardTitle>
              <CardDescription>Sous-titre ou description courte.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">Contenu principal.</p>
            </CardContent>
            <CardFooter>
              <Button size="sm">OK</Button>
            </CardFooter>
          </Card>
        </Section>

        <Section title="Carousel">
          <div className="relative w-full max-w-xs px-10">
            <Carousel className="w-full">
              <CarouselContent>
                {[1, 2, 3].map((i) => (
                  <CarouselItem key={i}>
                    <div className="rounded-xl border bg-muted/40 p-6 text-center text-sm">
                      Diapositive {i}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="-left-2" />
              <CarouselNext className="-right-2" />
            </Carousel>
          </div>
        </Section>

        <Section title="Chart">
          <ChartContainer config={CHART_CONFIG} className="h-48 w-full max-w-md">
            <BarChart accessibilityLayer data={CHART_DATA}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
            </BarChart>
          </ChartContainer>
        </Section>

        <Section title="Checkbox">
          <div className="flex items-center gap-2">
            <Checkbox id="c1" defaultChecked />
            <Label htmlFor="c1">Case cochée</Label>
          </div>
        </Section>

        <Section title="Collapsible">
          <Collapsible className="w-full max-w-md space-y-2">
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                Afficher plus
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="text-muted-foreground text-sm">
              Texte supplémentaire une fois déplié.
            </CollapsibleContent>
          </Collapsible>
        </Section>

        <Section title="Combobox">
          <Combobox items={[...COMBO_ITEMS]}>
            <ComboboxInput className="w-56" placeholder="Framework…" showClear />
            <ComboboxContent>
              <ComboboxEmpty>Aucun résultat</ComboboxEmpty>
              <ComboboxList>
                {(item: string) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </Section>

        <Section title="Command (dans Popover)">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Ouvrir commande</Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start">
              <Command>
                <CommandInput placeholder="Rechercher…" />
                <CommandList>
                  <CommandEmpty>Rien trouvé.</CommandEmpty>
                  <CommandGroup heading="Suggestions">
                    <CommandItem>Calendrier</CommandItem>
                    <CommandItem>Recherche</CommandItem>
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup heading="Autres">
                    <CommandItem>Paramètres</CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </Section>

        <Section title="Context menu">
          <ContextMenu>
            <ContextMenuTrigger className="flex size-32 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
              Clic droit ici
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem>Copier</ContextMenuItem>
              <ContextMenuItem>Coller</ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </Section>

        <Section title="Dialog">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Ouvrir dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Titre</DialogTitle>
                <DialogDescription>Description du dialogue.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button type="button" variant="outline">
                  Fermer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Section>

        <Section title="Drawer">
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline">Ouvrir drawer</Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Panel</DrawerTitle>
                <DrawerDescription>Contenu du tiroir (mobile-friendly).</DrawerDescription>
              </DrawerHeader>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button variant="outline" className="w-full">
                    Fermer
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </Section>

        <Section title="Dropdown menu">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profil</DropdownMenuItem>
              <DropdownMenuItem>Paramètres</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Section>

        <Section title="Empty">
          <Empty className="max-w-md border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Package className="size-5" />
              </EmptyMedia>
              <EmptyTitle>Aucun élément</EmptyTitle>
              <EmptyDescription>État vide pour listes ou résultats.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button size="sm">Créer</Button>
            </EmptyContent>
          </Empty>
        </Section>

        <Section title="Field">
          <FieldSet className="max-w-md rounded-xl border p-4">
            <FieldLegend>Formulaire démo</FieldLegend>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="ui-all-name">Nom</FieldLabel>
                <Input id="ui-all-name" placeholder="Jane" />
                <FieldDescription>Visible uniquement sur cette page.</FieldDescription>
              </Field>
            </FieldGroup>
          </FieldSet>
        </Section>

        <Section title="Hover card">
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="link" className="p-0">
                Survoler
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-64">
              <p className="text-sm">Contenu au survol.</p>
            </HoverCardContent>
          </HoverCard>
        </Section>

        <Section title="Input & Input group">
          <div className="flex w-full max-w-md flex-col gap-3">
            <Input placeholder="Input simple" />
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <InputGroupText>https://</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput placeholder="domaine.fr" />
              <InputGroupAddon align="inline-end">
                <InputGroupButton type="button">OK</InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>
        </Section>

        <Section title="Input OTP">
          <InputOTP maxLength={6}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </Section>

        <Section title="Item">
          <ItemGroup className="max-w-md">
            <Item variant="outline">
              <ItemMedia variant="icon">
                <Package className="size-4" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Élément liste</ItemTitle>
                <ItemDescription>Description courte.</ItemDescription>
              </ItemContent>
            </Item>
          </ItemGroup>
        </Section>

        <Section title="Kbd">
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </Section>

        <Section title="Label">
          <div className="space-y-2">
            <Label htmlFor="ui-all-email">Email</Label>
            <Input
              id="ui-all-email"
              type="email"
              placeholder="vous@exemple.fr"
              className="max-w-sm"
            />
          </div>
        </Section>

        <Section title="Menubar">
          <Menubar>
            <MenubarMenu>
              <MenubarTrigger>Fichier</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>Nouveau</MenubarItem>
                <MenubarSeparator />
                <MenubarItem>Quitter</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger>Édition</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>Copier</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </Section>

        <Section title="Native select">
          <NativeSelect defaultValue="b">
            <NativeSelectOptGroup label="Groupe">
              <NativeSelectOption value="a">Option A</NativeSelectOption>
              <NativeSelectOption value="b">Option B</NativeSelectOption>
            </NativeSelectOptGroup>
          </NativeSelect>
        </Section>

        <Section title="Navigation menu">
          <NavigationMenu viewport={false}>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Produit</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-56 gap-2 p-2">
                    <li>
                      <NavigationMenuLink className={navigationMenuTriggerStyle()} href="#">
                        Aperçu
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink className={navigationMenuTriggerStyle()} href="#">
                        Tarifs
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink className={navigationMenuTriggerStyle()} href="#">
                  Docs
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </Section>

        <Section title="Pagination">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">2</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </Section>

        <Section title="Popover">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Popover</Button>
            </PopoverTrigger>
            <PopoverContent>Contenu du popover.</PopoverContent>
          </Popover>
        </Section>

        <Section title="Progress">
          <Progress value={progress} className="max-w-xs" />
        </Section>

        <Section title="Radio group">
          <RadioGroup defaultValue="1" className="max-w-xs">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="1" id="r1" />
              <Label htmlFor="r1">Choix 1</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="2" id="r2" />
              <Label htmlFor="r2">Choix 2</Label>
            </div>
          </RadioGroup>
        </Section>

        <Section title="Resizable">
          <ResizablePanelGroup orientation="horizontal" className="h-40 max-w-md rounded-xl border">
            <ResizablePanel defaultSize={50} minSize={20}>
              <div className="flex h-full items-center justify-center bg-muted/30 text-sm">A</div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50} minSize={20}>
              <div className="flex h-full items-center justify-center bg-muted/50 text-sm">B</div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </Section>

        <Section title="Scroll area">
          <ScrollArea className="h-32 w-48 rounded-xl border">
            <div className="space-y-2 p-4 pr-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <p key={i} className="text-sm">
                  Ligne {i + 1}
                </p>
              ))}
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </Section>

        <Section title="Select">
          <Select defaultValue="apple">
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Choisir" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apple">Pomme</SelectItem>
              <SelectItem value="banana">Banane</SelectItem>
            </SelectContent>
          </Select>
        </Section>

        <Section title="Separator">
          <div className="flex w-full max-w-md items-center gap-4">
            <span className="text-sm">Gauche</span>
            <Separator orientation="vertical" className="h-6" />
            <span className="text-sm">Droite</span>
          </div>
          <Separator className="max-w-md" />
        </Section>

        <Section title="Sheet">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Sheet</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Titre sheet</SheetTitle>
                <SheetDescription>Contenu latéral.</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </Section>

        <Section title="Sidebar (aperçu)">
          <SidebarProvider className="flex min-h-48 w-full max-w-xl items-stretch rounded-xl border">
            <Sidebar collapsible="none" className="border-r">
              <SidebarHeader className="p-2 text-sm font-medium">Démo</SidebarHeader>
              <SidebarContent>
                <SidebarGroup>
                  <SidebarGroupLabel>Menu</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <a href="#">Lien</a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>
            </Sidebar>
            <SidebarInset className="flex flex-1 flex-col p-4">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <span className="text-muted-foreground text-sm">Zone principale</span>
              </div>
            </SidebarInset>
          </SidebarProvider>
        </Section>

        <Section title="Skeleton">
          <div className="flex max-w-xs flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </Section>

        <Section title="Slider">
          <Slider
            value={sliderVal}
            onValueChange={setSliderVal}
            max={100}
            step={1}
            className="max-w-xs"
          />
        </Section>

        <Section title="Sonner (toast)">
          <Button variant="outline" onClick={() => toast.success("Toast de démonstration")}>
            Afficher un toast
          </Button>
        </Section>

        <Section title="Spinner">
          <Spinner />
        </Section>

        <Section title="Switch">
          <div className="flex items-center gap-2">
            <Switch id="sw" defaultChecked />
            <Label htmlFor="sw">Activer</Label>
          </div>
        </Section>

        <Section title="Table">
          <Table className="max-w-md">
            <TableCaption>Caption du tableau</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead className="text-right">Valeur</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Alpha</TableCell>
                <TableCell className="text-right">1</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Bêta</TableCell>
                <TableCell className="text-right">2</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Section>

        <Section title="Tabs">
          <Tabs defaultValue="1" className="max-w-md">
            <TabsList>
              <TabsTrigger value="1">Un</TabsTrigger>
              <TabsTrigger value="2">Deux</TabsTrigger>
            </TabsList>
            <TabsContent value="1" className="text-sm">
              Contenu onglet 1
            </TabsContent>
            <TabsContent value="2" className="text-sm">
              Contenu onglet 2
            </TabsContent>
          </Tabs>
        </Section>

        <Section title="Textarea">
          <Textarea placeholder="Zone de texte…" className="max-w-md" rows={3} />
        </Section>

        <Section title="Toggle">
          <Toggle aria-label="Gras">B</Toggle>
        </Section>

        <Section title="Toggle group">
          <ToggleGroup type="single" defaultValue="left" variant="outline">
            <ToggleGroupItem value="left" aria-label="Gauche">
              ←
            </ToggleGroupItem>
            <ToggleGroupItem value="right" aria-label="Droite">
              →
            </ToggleGroupItem>
          </ToggleGroup>
        </Section>

        <Section title="Tooltip">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Survol</Button>
            </TooltipTrigger>
            <TooltipContent>Info-bulle</TooltipContent>
          </Tooltip>
        </Section>

        <footer className="text-muted-foreground border-t border-border/60 pt-8 text-sm">
          <p>
            Non affichés ici : <code className="font-mono">DirectionProvider</code> (
            <code className="font-mono">direction.tsx</code>),{" "}
            <code className="font-mono">Toaster</code> déjà dans le layout global.
          </p>
        </footer>
      </main>
    </div>
  );
}
